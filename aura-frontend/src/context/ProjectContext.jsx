import { useEffect, useRef, useState } from "react";
import { getCurrentUser } from "../services/authService";
import { isRemoteUser } from "../services/apiClient";
import { ProjectContext, useProject } from "./sharedProjectContext";
import { RemoteProjectProvider } from "./RemoteProjectProvider";
import {
  blankWorkspace,
  defaultSettings,
  membersFromNames,
  seedNotifications,
  seedProjects,
  seedWorkspaces,
} from "../data/mockData";

/*
 * Single source of truth for the dashboard.
 *
 * Two providers share one context shape (see ProjectProvider at the bottom):
 *   - LocalProjectProvider (this file): everything in localStorage. Used by the offline demo account.
 *   - RemoteProjectProvider: data from the Spring Boot API. Used by accounts created on the backend.
 *
 * - Everything is stored per user in localStorage, so data survives a refresh.
 * - Each project has its own workspace (components, feedback, revisions, ...).
 * - `data` always reflects the currently selected project, which is what the
 *   pages already expect.
 * - Swap the bodies of the actions for API calls when the Spring Boot
 *   endpoints are ready; the pages do not need to change.
 */

const EMPTY = { components: [], revisions: [], feedback: [], feedbackHistory: [], files: [], history: [], members: [], tasks: [] };

const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();
const clone = (v) => JSON.parse(JSON.stringify(v));

const initialState = () => ({
  projects: clone(seedProjects),
  workspaces: clone(seedWorkspaces()),
  notifications: clone(seedNotifications),
  selectedId: null,
  settings: clone(defaultSettings),
});

const storageKeyFor = (user) => `aura_state_v1:${user?.id ?? user?.studentId ?? user?.email ?? "guest"}`;

function loadState(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      const base = initialState();
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
    /* corrupted storage: fall through to a fresh state */
  }
  return initialState();
}

const average = (list) => (list.length ? Math.round(list.reduce((s, c) => s + (c.progress || 0), 0) / list.length) : null);

function LocalProjectProvider({ children }) {
  const [user, setUserState] = useState(() => getCurrentUser());
  const keyRef = useRef(storageKeyFor(getCurrentUser()));
  const [state, setState] = useState(() => loadState(keyRef.current));

  // persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(keyRef.current, JSON.stringify(state));
    } catch {
      /* storage full or unavailable: keep working in memory */
    }
  }, [state]);

  /* ---------- derived values ---------- */
  const selectedProject = state.projects.find((p) => p.id === state.selectedId) || null;
  const ws = (selectedProject && state.workspaces[selectedProject.id]) || EMPTY;
  const me = () => user?.fullName || "You";

  const data = {
    user,
    notifications: state.notifications,
    project: selectedProject ? { ...selectedProject, adviser: selectedProject.professor } : {},
    ...EMPTY,
    ...ws,
    // working views show current feedback; superseded versions are kept for the history views
    feedback: (ws.feedback || []).filter((f) => f.status !== "Superseded"),
    feedbackHistory: ws.feedback || [],
  };

  const compName = (id) => ws.components.find((c) => c.id === id)?.name ?? "—";
  const memberName = (id) => ws.members.find((m) => m.id === id)?.name ?? "—";

  const projectProgress = (p) => {
    const avg = average((state.workspaces[p.id] || EMPTY).components);
    return avg ?? p.progress ?? 0;
  };

  /* ---------- low-level helpers ---------- */
  const mkLog = (type, message, componentId = "", changes = { added: 0, removed: 0 }) => ({
    id: uid("h"),
    hash: Math.random().toString(16).slice(2, 9),
    type,
    message,
    author: me(),
    date: nowIso(),
    componentId,
    changes,
  });

  const mkNote = (category, text) => ({
    id: uid("n"),
    category,
    text,
    date: nowIso(),
    read: false,
    projectId: selectedProject?.id,
    projectTitle: selectedProject?.title,
  });

  // update the selected project's workspace, optionally adding a history entry and a notification
  const commit = (fn, log, note) =>
    setState((s) => {
      if (!s.selectedId) return s;
      const w = { ...EMPTY, ...(s.workspaces[s.selectedId] || {}) };
      let next = fn(w);
      if (log) next = { ...next, history: [log, ...next.history] };
      return {
        ...s,
        workspaces: { ...s.workspaces, [s.selectedId]: next },
        notifications: note ? [note, ...s.notifications] : s.notifications,
      };
    });

  /* ---------- actions ---------- */
  const actions = {
    /* projects */
    addProject(form) {
      const project = {
        id: uid("proj-"),
        title: form.title,
        status: form.status || "Pending",
        description: form.description || "",
        semester: form.semester || "",
        subjectSection: form.subjectSection || "",
        professor: form.professor || "",
        deadline: form.deadline || "",
        members: form.members || [],
        progress: 0,
      };
      setState((s) => ({
        ...s,
        projects: [project, ...s.projects],
        workspaces: { ...s.workspaces, [project.id]: blankWorkspace(project) },
      }));
      return project;
    },

    updateProject(id, patch) {
      setState((s) => {
        const projects = s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
        const w = { ...EMPTY, ...(s.workspaces[id] || {}) };
        let members = w.members;
        if (patch.members) {
          // keep existing member records (matched by name), add new names
          const kept = patch.members.map((name) => members.find((m) => m.name === name)).filter(Boolean);
          const added = membersFromNames(
            patch.members.filter((name) => !members.some((m) => m.name === name)),
            `m${Date.now().toString(36)}-`
          ).map((m) => ({ ...m, role: "Member" }));
          members = [...kept, ...added];
        }
        return { ...s, projects, workspaces: { ...s.workspaces, [id]: { ...w, members } } };
      });
    },

    deleteProject(id) {
      setState((s) => {
        const { [id]: _removed, ...workspaces } = s.workspaces;
        return {
          ...s,
          projects: s.projects.filter((p) => p.id !== id),
          workspaces,
          notifications: s.notifications.filter((n) => n.projectId !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        };
      });
    },

    /* components */
    addComponent(form) {
      const c = {
        id: uid("c"),
        name: form.name,
        description: form.description || "",
        status: form.status || "Pending",
        approval: "Not Requested",
        progress: Number(form.progress) || 0,
        due: form.due || "",
        owner: form.owner || "",
      };
      commit((w) => ({ ...w, components: [...w.components, c] }), mkLog("change", `Added component "${c.name}"`, c.id));
    },

    updateComponent(id, patch) {
      const c = ws.components.find((x) => x.id === id);
      const statusChanged = c && patch.status && patch.status !== c.status;
      commit(
        (w) => ({
          ...w,
          components: w.components.map((x) =>
            x.id === id
              ? { ...x, ...patch, progress: patch.status === "Approved" ? 100 : Number(patch.progress ?? x.progress) || 0 }
              : x
          ),
        }),
        mkLog("change", statusChanged ? `"${c.name}" status changed to ${patch.status}` : `Updated component "${c?.name ?? ""}"`, id)
      );
    },

    deleteComponent(id) {
      const c = ws.components.find((x) => x.id === id);
      commit(
        (w) => ({
          ...w,
          components: w.components.filter((x) => x.id !== id),
          revisions: w.revisions.filter((r) => r.componentId !== id),
          feedback: w.feedback.filter((f) => f.componentId !== id),
          tasks: w.tasks.filter((t) => t.componentId !== id),
          files: w.files.map((f) => (f.componentId === id ? { ...f, componentId: "" } : f)),
        }),
        mkLog("change", `Removed component "${c?.name ?? ""}"`)
      );
    },

    requestApproval(id) {
      const c = ws.components.find((x) => x.id === id);
      commit(
        (w) => ({ ...w, components: w.components.map((x) => (x.id === id ? { ...x, approval: "Pending" } : x)) }),
        mkLog("approval", `Requested adviser approval for "${c?.name ?? ""}"`, id),
        mkNote("approval", `Approval requested for ${c?.name ?? "a component"}`)
      );
    },

    // the student records the adviser's decision (instructor accounts are optional)
    setApproval(id, approval) {
      const c = ws.components.find((x) => x.id === id);
      commit(
        (w) => ({
          ...w,
          components: w.components.map((x) => {
            if (x.id !== id) return x;
            if (approval === "Approved") return { ...x, approval, status: "Approved", progress: 100 };
            if (approval === "Rejected") return { ...x, approval, status: "For Revision" };
            return { ...x, approval };
          }),
        }),
        mkLog("approval", `"${c?.name ?? ""}" marked ${approval} by adviser`, id),
        mkNote("approval", `${c?.name ?? "A component"} was marked ${approval}`)
      );
    },

    /* feedback */
    addFeedback({ componentId, type, givenBy, text }) {
      const f = {
        id: uid("f"),
        componentId,
        type,
        status: "Open",
        author: givenBy || me(),
        date: nowIso(),
        text: text.trim(),
        replies: [],
      };
      const label = type === "clarification" ? "Clarification requested" : "Feedback recorded";
      commit(
        (w) => ({ ...w, feedback: [f, ...w.feedback] }),
        mkLog("feedback", `${label}: ${f.text.slice(0, 70)}`, componentId),
        mkNote("feedback", `${type === "clarification" ? "Clarification needed" : "New feedback"} on ${compName(componentId)}`)
      );
      return f;
    },

    addReply(feedbackId, text) {
      const reply = { id: uid("p"), author: me(), date: nowIso(), text };
      commit((w) => ({
        ...w,
        feedback: w.feedback.map((f) => (f.id === feedbackId ? { ...f, replies: [...f.replies, reply] } : f)),
      }));
    },

    setFeedbackStatus(id, status) {
      const f = ws.feedback.find((x) => x.id === id);
      commit(
        (w) => ({ ...w, feedback: w.feedback.map((x) => (x.id === id ? { ...x, status } : x)) }),
        mkLog("feedback", `${status === "Resolved" ? "Resolved" : "Reopened"}: ${(f?.text || "").slice(0, 70)}`, f?.componentId)
      );
    },

    // The instructor changed their instructions: keep the old version (marked Superseded) and add a new one.
    reviseFeedback(id, { text, reason }) {
      const old = ws.feedback.find((x) => x.id === id);
      if (!old || old.status === "Superseded") return null;
      const next = {
        ...old,
        id: uid("f"),
        text: text.trim(),
        date: nowIso(),
        status: "Open",
        replies: [],
        version: (old.version || 1) + 1,
        previousFeedbackId: old.id,
        supersededById: "",
      };
      commit(
        (w) => ({
          ...w,
          feedback: [next, ...w.feedback.map((x) => (x.id === id ? { ...x, status: "Superseded", supersededById: next.id } : x))],
        }),
        mkLog("feedback", `Instructions changed on "${compName(old.componentId)}"${reason ? `: ${reason.trim()}` : ""}`, old.componentId),
        mkNote("feedback", `Updated feedback on ${compName(old.componentId)}`)
      );
      return next;
    },

    // Documents a change the group made in response to feedback.
    recordRevision({ feedbackId, componentId, summary }) {
      const f = ws.feedback.find((x) => x.id === feedbackId);
      const cid = componentId || f?.componentId || "";
      commit((w) => w, { ...mkLog("revision", `Revision on "${compName(cid)}": ${summary.trim()}`, cid), feedbackId: feedbackId || "" });
      return true;
    },

    /* revisions and their checklists */
    addRevision({ componentId, title, tasks = [] }) {
      const r = {
        id: uid("r"),
        componentId,
        title,
        status: "Pending",
        tasks: tasks.map((text) => ({ id: uid("t"), text, done: false })),
      };
      commit((w) => ({ ...w, revisions: [...w.revisions, r] }), mkLog("revision", `Created revision "${title}"`, componentId));
    },

    addRevisionTask(revisionId, text) {
      commit((w) => ({
        ...w,
        revisions: w.revisions.map((r) =>
          r.id === revisionId ? { ...r, tasks: [...r.tasks, { id: uid("t"), text, done: false }] } : r
        ),
      }));
    },

    toggleTask(revisionId, taskId) {
      commit((w) => ({
        ...w,
        revisions: w.revisions.map((r) =>
          r.id === revisionId
            ? { ...r, tasks: r.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
            : r
        ),
      }));
    },

    // moving a revision also moves its component, so the dashboard stays consistent
    setRevisionStatus(id, status) {
      const r = ws.revisions.find((x) => x.id === id);
      const approvalFor = { Approved: "Approved", Submitted: "Pending", Resubmitted: "Pending", "Under Review": "Pending" };
      commit(
        (w) => ({
          ...w,
          revisions: w.revisions.map((x) => (x.id === id ? { ...x, status } : x)),
          components: w.components.map((c) =>
            c.id === r?.componentId
              ? {
                  ...c,
                  status,
                  approval: approvalFor[status] ?? c.approval,
                  progress: status === "Approved" ? 100 : c.progress,
                }
              : c
          ),
        }),
        mkLog(status === "Approved" ? "approval" : "revision", `"${r?.title ?? ""}" moved to ${status}`, r?.componentId),
        mkNote(status === "Approved" ? "approval" : "team", `"${r?.title ?? "Revision"}" moved to ${status}`)
      );
    },

    /* next actions (team tasks, optionally linked to a feedback item) */
    addTask({ title, assignee = "", componentId = "", due = "", feedbackId = "", status = "To Do" }) {
      const t = { id: uid("k"), title: title.trim(), assignee, componentId, due, feedbackId, status };
      commit(
        (w) => ({ ...w, tasks: [...w.tasks, t] }),
        mkLog("change", `New action: ${t.title}`, componentId),
        assignee ? mkNote("team", `${memberName(assignee)} was assigned: ${t.title}`) : undefined
      );
    },

    setTaskStatus(id, status) {
      const t = ws.tasks.find((x) => x.id === id);
      commit(
        (w) => ({ ...w, tasks: w.tasks.map((x) => (x.id === id ? { ...x, status } : x)) }),
        status === "Done" ? mkLog("change", `Completed action: ${t?.title ?? ""}`, t?.componentId) : undefined
      );
    },

    deleteTask(id) {
      commit((w) => ({ ...w, tasks: w.tasks.filter((x) => x.id !== id) }));
    },

    /* team */
    addMember({ name, role = "Member", email = "" }) {
      const m = { id: uid("m"), name: name.trim(), role, email, responsibilities: [] };
      commit((w) => ({ ...w, members: [...w.members, m] }), mkLog("change", `Added team member ${m.name}`));
    },

    addResponsibility(memberId, text) {
      commit((w) => ({
        ...w,
        members: w.members.map((m) => (m.id === memberId ? { ...m, responsibilities: [...m.responsibilities, text] } : m)),
      }));
    },

    /* files and links */
    addFile({ kind, name, url, size, componentId }) {
      const f = { id: uid("x"), kind, name, url, size, componentId, addedBy: me(), date: nowIso() };
      commit(
        (w) => ({ ...w, files: [f, ...w.files] }),
        mkLog("change", `Added ${kind === "file" ? "file" : kind === "link" ? "link" : "reference"}: ${name}`, componentId),
        mkNote("team", `${me()} added ${name}`)
      );
    },

    setFileComponent(id, componentId) {
      commit((w) => ({ ...w, files: w.files.map((f) => (f.id === id ? { ...f, componentId } : f)) }));
    },

    removeFile(id) {
      commit((w) => ({ ...w, files: w.files.filter((f) => f.id !== id) }));
    },

    /* notifications */
    markRead(id) {
      setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    },

    markAllRead(category) {
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) => (!category || n.category === category ? { ...n, read: true } : n)),
      }));
    },

    /* settings */
    updateSettings(patch) {
      setState((s) => ({ ...s, settings: typeof patch === "function" ? patch(s.settings) : { ...s.settings, ...patch } }));
    },

    /* demo data */
    resetData() {
      setState(initialState());
    },
  };

  const setSelectedProject = (p) => setState((s) => ({ ...s, selectedId: p ? p.id : null }));

  return (
    <ProjectContext.Provider
      value={{
        data,
        user,
        setUser: setUserState,
        settings: state.settings,
        setSettings: actions.updateSettings,
        projects: state.projects,
        selectedProject,
        setSelectedProject,
        projectProgress,
        compName,
        memberName,
        actions,
        remote: false,
        loading: false,
        error: "",
        clearError: () => {},
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

/*
 * Accounts created by the Spring Boot backend (numeric ids) use the server; the offline demo account and
 * accounts created while the server was unreachable keep using localStorage.
 */
export function ProjectProvider({ children }) {
  const [remote] = useState(() => isRemoteUser(getCurrentUser()));
  const Provider = remote ? RemoteProjectProvider : LocalProjectProvider;
  return <Provider>{children}</Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export { useProject };
