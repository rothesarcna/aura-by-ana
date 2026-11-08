import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentUser } from "../services/authService";
import { errorMessage } from "../services/apiClient";
import { deriveRevisions, projectApi, toNumber } from "../services/projectApi";
import { defaultSettings } from "../data/mockData";
import { ProjectContext } from "./sharedProjectContext";

/*
 * Project state backed by the Spring Boot API. It exposes exactly the same value as the localStorage
 * provider, so the pages do not care which one they are talking to.
 *
 * - Projects, components, feedback, tasks, members and history live on the server. After every change the
 *   affected project is reloaded, so the screen always shows what the server holds.
 * - Failed requests never throw into the pages; the message lands in `error` and is shown in a banner.
 * - A few things have no server endpoint yet and stay in this browser (localStorage): files and links,
 *   member responsibilities, settings, and the notification list. Notifications about deadlines, overdue
 *   tasks and open feedback are recomputed from the server data every time a project loads.
 */

const EMPTY = { components: [], revisions: [], feedback: [], feedbackHistory: [], files: [], history: [], members: [], tasks: [] };

const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();
const clone = (v) => JSON.parse(JSON.stringify(v));
const storageKeyFor = (user) => `aura_remote_v1:${user?.id}`;

const initialLocal = () => ({
  selectedId: null,
  settings: clone(defaultSettings),
  notifications: [],
  files: {}, // { [projectId]: [file, ...] }
  responsibilities: {}, // { [projectId]: { [memberId]: [text, ...] } }
});

function loadLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      const base = initialLocal();
      return {
        ...base,
        ...saved,
        settings: {
          ...base.settings,
          ...saved.settings,
          notify: { ...base.settings.notify, ...saved.settings?.notify },
          privacy: { ...base.settings.privacy, ...saved.settings?.privacy },
        },
      };
    }
  } catch {
    /* corrupted storage: start fresh */
  }
  return initialLocal();
}

const average = (list) => (list.length ? Math.round(list.reduce((s, c) => s + (c.progress || 0), 0) / list.length) : null);

const shortDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/* Notifications worth showing, worked out from the project's current data. */
function deriveNotes(project, ws, feedbackAll) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = (iso) => Math.round((new Date(`${iso}T00:00:00`) - today) / 86400000);
  const compName = (id) => ws.components.find((c) => c.id === id)?.name ?? "a component";
  const base = { read: false, projectId: project.id, projectTitle: project.title, auto: true, date: nowIso() };
  const notes = [];

  ws.components.forEach((c) => {
    if (c.status !== "Approved" && c.due) {
      const d = daysUntil(c.due);
      if (d < 0) notes.push({ ...base, id: `auto:due:${c.id}:${c.due}`, category: "deadline", text: `${c.name} was due on ${shortDate(c.due)}` });
      else if (d <= 7) notes.push({ ...base, id: `auto:due:${c.id}:${c.due}`, category: "deadline", text: `${c.name} is due on ${shortDate(c.due)}` });
    }
    if (c.approval === "Pending") {
      notes.push({ ...base, id: `auto:apr:${c.id}:${c.status}`, category: "approval", text: `${c.name} is waiting for the adviser's decision` });
    }
    const open = ws.tasks.filter((t) => t.componentId === c.id && t.status !== "Done").length;
    if (c.status === "For Revision" && open > 0) {
      notes.push({ ...base, id: `auto:rev:${c.id}:${open}`, category: "reminder", text: `${c.name} still has ${open} unfinished revision task${open === 1 ? "" : "s"}` });
    }
  });

  ws.tasks.forEach((t) => {
    if (t.status !== "Done" && t.due && daysUntil(t.due) < 0) {
      notes.push({ ...base, id: `auto:task:${t.id}:${t.due}`, category: "reminder", text: `Task "${t.title}" is overdue (${compName(t.componentId)}, due ${shortDate(t.due)})` });
    }
  });

  feedbackAll.forEach((f) => {
    if (f.status !== "Open") return;
    if (f.type === "clarification") {
      notes.push({ ...base, id: `auto:clar:${f.id}`, category: "feedback", text: `Clarification still unanswered on ${compName(f.componentId)}: ${f.text.slice(0, 60)}` });
    } else {
      notes.push({ ...base, id: `auto:fb:${f.id}`, category: "feedback", text: `Open feedback on ${compName(f.componentId)}: ${f.text.slice(0, 60)}` });
    }
  });
  return notes;
}

// Replace this project's computed notifications, keeping each one's read state and original date.
function mergeAutoNotes(existing, project, ws, feedbackAll) {
  const previous = new Map(existing.filter((n) => n.auto && n.projectId === project.id).map((n) => [n.id, n]));
  const kept = existing.filter((n) => !(n.auto && n.projectId === project.id));
  const fresh = deriveNotes(project, ws, feedbackAll).map((n) => (previous.has(n.id) ? { ...n, read: previous.get(n.id).read, date: previous.get(n.id).date } : n));
  return [...fresh, ...kept];
}

export function RemoteProjectProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [storageKey] = useState(() => storageKeyFor(getCurrentUser()));
  const [local, setLocal] = useState(() => loadLocal(storageKey));
  const [projects, setProjects] = useState([]);
  const [workspaces, setWorkspaces] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedId = local.selectedId;
  const selectedRef = useRef(selectedId);
  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  // keep this browser's own data (files, settings, notifications, selection) across reloads
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(local));
    } catch {
      /* storage full or unavailable: keep working in memory */
    }
  }, [local, storageKey]);

  /* ---------- loading from the server ---------- */
  const loadProjects = useCallback(async () => {
    const list = await projectApi.listProjects();
    setProjects(list);
    return list;
  }, []);

  // Reload one project (and its workspace). With no id, reloads the project list only.
  const refresh = useCallback(
    async (projectId) => {
      const id = projectId ?? selectedRef.current;
      if (!id) {
        await loadProjects();
        return;
      }
      const [project, w] = await Promise.all([projectApi.getProject(id), projectApi.loadWorkspace(id)]);
      const workspace = {
        components: w.components,
        tasks: w.tasks,
        members: w.members,
        history: w.history,
        feedback: w.feedbackAll.filter((f) => f.status !== "Superseded"),
        feedbackHistory: w.feedbackAll,
      };
      setProjects((list) => (list.some((p) => p.id === project.id) ? list.map((p) => (p.id === project.id ? project : p)) : [project, ...list]));
      setWorkspaces((prev) => ({ ...prev, [id]: workspace }));
      setLocal((l) => ({ ...l, notifications: mergeAutoNotes(l.notifications, project, workspace, w.feedbackAll) }));
    },
    [loadProjects]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await projectApi.listProjects();
        if (cancelled) return;
        setProjects(list);
        const sel = selectedRef.current;
        if (sel && list.some((p) => p.id === sel)) await refresh(sel);
        else if (sel) setLocal((l) => ({ ...l, selectedId: null }));
      } catch (e) {
        if (!cancelled) setError(errorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  /* ---------- helpers ---------- */
  // Runs a server change, then reloads. Returns the result, or null after showing the error.
  const run = async (fn, { reload = true, list = false } = {}) => {
    try {
      const result = await fn();
      setError("");
      if (list) await loadProjects();
      if (reload) await refresh();
      return result ?? true;
    } catch (e) {
      setError(errorMessage(e));
      return null;
    }
  };

  const pushNote = (category, text) => {
    const p = projects.find((x) => x.id === selectedRef.current);
    setLocal((l) => ({
      ...l,
      notifications: [{ id: uid("n"), category, text, date: nowIso(), read: false, projectId: p?.id, projectTitle: p?.title }, ...l.notifications],
    }));
  };

  /* ---------- derived values ---------- */
  const selectedProject = projects.find((p) => p.id === selectedId) || null;
  const ws = (selectedProject && workspaces[selectedProject.id]) || EMPTY;
  const responsibilities = (selectedProject && local.responsibilities[selectedProject.id]) || {};
  const files = (selectedProject && local.files[selectedProject.id]) || [];

  const data = {
    user,
    notifications: local.notifications,
    project: selectedProject ? { ...selectedProject, adviser: selectedProject.professor } : {},
    ...EMPTY,
    ...ws,
    revisions: deriveRevisions(ws.components, ws.tasks),
    members: ws.members.map((m) => ({ ...m, responsibilities: responsibilities[m.id] || [] })),
    files,
  };

  const compName = (id) => ws.components.find((c) => c.id === id)?.name ?? "—";
  const memberName = (id) => ws.members.find((m) => m.id === id)?.name ?? "—";

  const projectProgress = (p) => {
    const w = workspaces[p.id];
    return (w && average(w.components)) ?? p.progress ?? 0;
  };

  const sid = () => selectedRef.current;
  const patchLocalProject = (fn) =>
    setLocal((l) => {
      const id = sid();
      return id ? fn(l, id) : l;
    });

  /* ---------- actions (same names as the localStorage provider) ---------- */
  const actions = {
    reload: () => run(() => Promise.resolve(), { list: true }),

    /* projects */
    addProject: (form) =>
      run(
        () =>
          projectApi.createProject({
            title: form.title,
            status: form.status || "Pending",
            description: form.description || "",
            semester: form.semester || "",
            subjectSection: form.subjectSection || "",
            adviser: form.professor || "",
            deadline: form.deadline || null,
            members: form.members || [],
          }),
        { reload: false, list: true }
      ),

    updateProject: (id, patch) =>
      run(
        async () => {
          const cur = projects.find((p) => p.id === id);
          const pick = (k) => (k in patch ? patch[k] : cur[k]);
          await projectApi.updateProject(id, {
            title: pick("title"),
            type: cur.type,
            adviser: pick("professor"),
            startDate: cur.startDate,
            description: pick("description"),
            semester: pick("semester"),
            subjectSection: pick("subjectSection"),
            deadline: pick("deadline") || null,
            status: pick("status"),
          });
          if (patch.members) {
            const current = await projectApi.listMembers(id);
            const wanted = patch.members.map((n) => n.trim()).filter(Boolean);
            const has = (name) => current.some((m) => m.name.toLowerCase() === name.toLowerCase());
            for (const name of wanted) if (!has(name)) await projectApi.addMember(id, { name });
            for (const m of current) {
              const keep = wanted.some((n) => n.toLowerCase() === m.name.toLowerCase()) || m.userId === String(user?.id);
              if (!keep) await projectApi.removeMember(id, m.id);
            }
          }
        },
        { reload: id === sid(), list: true }
      ),

    deleteProject: async (id) => {
      const ok = await run(() => projectApi.deleteProject(id), { reload: false, list: true });
      if (ok) setLocal((l) => (l.selectedId === id ? { ...l, selectedId: null } : l));
      return ok;
    },

    /* components */
    addComponent: (form) =>
      run(() =>
        projectApi.createComponent(sid(), {
          name: form.name,
          description: form.description || "",
          dueDate: form.due || null,
          ownerId: toNumber(form.owner),
          progress: Number(form.progress) || 0,
          status: form.status || "Pending",
        })
      ),

    updateComponent: (id, patch) =>
      run(async () => {
        const cur = ws.components.find((c) => c.id === id);
        await projectApi.updateComponent(sid(), id, {
          name: patch.name ?? cur.name,
          description: patch.description ?? cur.description,
          dueDate: (patch.due ?? cur.due) || null,
          progress: Number(patch.progress ?? cur.progress) || 0,
          ownerId: toNumber("owner" in patch ? patch.owner : cur.owner),
        });
        if (patch.status && patch.status !== cur.status) await projectApi.setComponentStatus(sid(), id, patch.status);
      }),

    deleteComponent: (id) => run(() => projectApi.deleteComponent(sid(), id)),

    // The adviser has no account: "approval" is recorded as the component's status.
    requestApproval: (id) => run(() => projectApi.setComponentStatus(sid(), id, "Submitted", "Adviser approval requested")),

    setApproval: (id, approval) => {
      const status = { Approved: "Approved", Rejected: "For Revision", Pending: "Under Review" }[approval] ?? "Pending";
      return run(() => projectApi.setComponentStatus(sid(), id, status, `Adviser decision: ${approval}`));
    },

    /* feedback */
    addFeedback: ({ componentId, type, givenBy, text }) =>
      run(() =>
        projectApi.createFeedback(sid(), {
          componentId: toNumber(componentId),
          type,
          text: text.trim(),
          givenBy: givenBy?.trim() || null,
        })
      ),

    // The instructor changed their instructions: keeps the old version and records a new one.
    reviseFeedback: (id, { text, reason }) =>
      run(() => projectApi.reviseFeedback(sid(), id, { text: text.trim(), reason: reason?.trim() || null })),

    // Documents a change the group made in response to feedback (shows up in Revision History).
    recordRevision: ({ feedbackId, taskId, componentId, summary }) =>
      run(() =>
        projectApi.recordRevision(sid(), {
          feedbackId: toNumber(feedbackId),
          taskId: toNumber(taskId),
          componentId: toNumber(componentId),
          summary: summary.trim(),
        })
      ),

    addReply: (feedbackId, text) => run(() => projectApi.addReply(sid(), feedbackId, text)),

    setFeedbackStatus: (id, status) => run(() => projectApi.setFeedbackStatus(sid(), id, status)),

    /* revisions: one per component, a checklist of that component's tasks */
    addRevision: ({ componentId, title, tasks = [] }) =>
      run(async () => {
        const titles = tasks.length ? tasks : [title];
        for (const t of titles) await projectApi.createTask(sid(), { title: t, componentId: toNumber(componentId) });
      }),

    addRevisionTask: (revisionId, text) => run(() => projectApi.createTask(sid(), { title: text, componentId: toNumber(revisionId) })),

    toggleTask: (revisionId, taskId) => {
      const t = ws.tasks.find((x) => x.id === taskId);
      if (!t) return null;
      return run(() => projectApi.setTaskStatus(sid(), taskId, t.status === "Done" ? "To Do" : "Done"));
    },

    setRevisionStatus: (id, status) => run(() => projectApi.setComponentStatus(sid(), id, status)),

    /* next actions: tasks, optionally linked to a feedback item */
    addTask: async ({ title, assignee = "", componentId = "", due = "", feedbackId = "", status = "To Do" }) => {
      if (!feedbackId && !componentId) {
        setError("Choose a component (or open a feedback item) for this task.");
        return null;
      }
      const body = { title: title.trim(), assigneeId: toNumber(assignee), dueDate: due || null, status };
      const created = await run(() =>
        feedbackId
          ? projectApi.createFeedbackTask(sid(), feedbackId, body)
          : projectApi.createTask(sid(), { ...body, componentId: toNumber(componentId) })
      );
      if (created && assignee) pushNote("team", `${memberName(assignee)} was assigned: ${title.trim()}`);
      return created;
    },

    setTaskStatus: (id, status) => run(() => projectApi.setTaskStatus(sid(), id, status)),

    deleteTask: (id) => run(() => projectApi.deleteTask(sid(), id)),

    /* team */
    addMember: ({ name, role = "Member", email = "" }) =>
      run(() => projectApi.addMember(sid(), { name: name.trim(), role, email: email.trim() || null })),

    // Not stored on the server yet: kept in this browser.
    addResponsibility: (memberId, text) =>
      patchLocalProject((l, id) => {
        const forProject = l.responsibilities[id] || {};
        return {
          ...l,
          responsibilities: { ...l.responsibilities, [id]: { ...forProject, [memberId]: [...(forProject[memberId] || []), text] } },
        };
      }),

    /* files and links (browser only: there is no file endpoint yet) */
    addFile: ({ kind, name, url, size, componentId }) => {
      const f = { id: uid("x"), kind, name, url, size, componentId, addedBy: user?.fullName || "You", date: nowIso() };
      patchLocalProject((l, id) => ({ ...l, files: { ...l.files, [id]: [f, ...(l.files[id] || [])] } }));
      pushNote("team", `${f.addedBy} added ${name}`);
    },

    setFileComponent: (fileId, componentId) =>
      patchLocalProject((l, id) => ({
        ...l,
        files: { ...l.files, [id]: (l.files[id] || []).map((f) => (f.id === fileId ? { ...f, componentId } : f)) },
      })),

    removeFile: (fileId) =>
      patchLocalProject((l, id) => ({ ...l, files: { ...l.files, [id]: (l.files[id] || []).filter((f) => f.id !== fileId) } })),

    /* notifications */
    markRead: (id) => setLocal((l) => ({ ...l, notifications: l.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

    markAllRead: (category) =>
      setLocal((l) => ({
        ...l,
        notifications: l.notifications.map((n) => (!category || n.category === category ? { ...n, read: true } : n)),
      })),

    /* settings */
    updateSettings: (patch) =>
      setLocal((l) => ({ ...l, settings: typeof patch === "function" ? patch(l.settings) : { ...l.settings, ...patch } })),

    // Clears only what is stored in this browser. Projects on the server are untouched.
    resetData: () => {
      setLocal((l) => ({ ...initialLocal(), selectedId: l.selectedId }));
      refresh().catch((e) => setError(errorMessage(e)));
    },
  };

  const setSelectedProject = (p) => {
    const id = p ? p.id : null;
    setLocal((l) => ({ ...l, selectedId: id }));
    selectedRef.current = id;
    if (id) refresh(id).catch((e) => setError(errorMessage(e)));
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>Loading your projects…</div>;
  }

  return (
    <ProjectContext.Provider
      value={{
        data,
        user,
        setUser,
        settings: local.settings,
        setSettings: actions.updateSettings,
        projects,
        selectedProject,
        setSelectedProject,
        projectProgress,
        compName,
        memberName,
        actions,
        remote: true,
        loading,
        error,
        clearError: () => setError(""),
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
