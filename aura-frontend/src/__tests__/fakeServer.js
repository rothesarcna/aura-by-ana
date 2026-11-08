import { api } from "../services/apiClient";

/*
 * A tiny in-memory stand-in for the Spring Boot API. Its responses have the same field names and rules as the
 * Java DTOs (see aura-backend/docs/API.md), so the frontend's server-backed provider can be tested end to end
 * without running Java.
 */
export function installFakeServer() {
  const s = {
    seq: 100,
    projects: [], members: [], components: [], feedback: [], replies: [], tasks: [], history: [],
    requests: [],
    failNext: null, // { status, error } makes the next request fail
  };
  const id = () => ++s.seq;
  const now = () => new Date().toISOString();
  const today = () => new Date().toISOString().slice(0, 10);

  const log = (projectId, type, message, extra = {}) =>
    s.history.unshift({ id: id(), type, message, projectId, componentId: null, feedbackId: null, taskId: null, oldValue: null, newValue: null, actorId: 7, actorName: "Ana Reyes", createdAt: now(), ...extra });

  const memberDto = (m) => ({ id: m.id, name: m.name, email: m.email, role: m.role, userId: m.userId, registered: !!m.userId, active: m.active });
  const projectDto = (p) => {
    const comps = s.components.filter((c) => c.projectId === p.id && !c.archived);
    return {
      ...p, professor: p.adviser,
      progress: comps.length ? Math.round(comps.reduce((a, c) => a + c.progress, 0) / comps.length) : 0,
      componentCount: comps.length, openTaskCount: 0, unresolvedFeedbackCount: 0,
      members: s.members.filter((m) => m.projectId === p.id && m.active).map(memberDto),
    };
  };
  const componentDto = (c) => ({ ...c, ownerName: null, overdue: false, openFeedbackCount: 0, openTaskCount: 0 });
  const feedbackDto = (f) => ({
    ...f, componentName: s.components.find((c) => c.id === f.componentId)?.name,
    supersededById: s.feedback.find((x) => x.previousFeedbackId === f.id)?.id ?? null,
    replies: s.replies.filter((r) => r.feedbackId === f.id).map((r) => ({ id: r.id, author: r.author, text: r.text, createdAt: r.createdAt })),
  });
  const taskDto = (t) => ({ ...t, assigneeName: null, overdue: false });

  const fail = (status, error) => { const e = new Error(error); e.response = { status, data: { error } }; throw e; };
  const ok = (data, status = 200) => ({ data, status });

  function route(method, url, body, params) {
    let m;
    if (method === "get" && url === "/projects") return ok(s.projects.filter((p) => !p.archived).map(projectDto));
    if (method === "post" && url === "/projects") {
      if (!body.title) fail(400, "title must not be blank");
      const p = { id: id(), title: body.title, type: null, adviser: body.adviser || null, startDate: null, description: body.description || null, semester: body.semester || null, subjectSection: body.subjectSection || null, deadline: body.deadline || null, status: body.status || "Pending", ownerId: 7, archived: false };
      s.projects.push(p);
      s.members.push({ id: id(), projectId: p.id, userId: 7, name: "Ana Reyes", email: "ana@x.ph", role: "Team Leader", active: true });
      (body.members || []).forEach((name) => s.members.push({ id: id(), projectId: p.id, userId: null, name, email: null, role: "Member", active: true }));
      log(p.id, "Project", `Created project "${p.title}"`);
      return ok(projectDto(p), 201);
    }
    if ((m = url.match(/^\/projects\/(\d+)(\/.*)?$/))) {
      const pid = Number(m[1]); const rest = m[2] || "";
      const p = s.projects.find((x) => x.id === pid && !x.archived);
      if (!p) fail(404, "Project not found.");
      if (rest === "") {
        if (method === "get") return ok(projectDto(p));
        if (method === "put") { Object.assign(p, { title: body.title, adviser: body.adviser, description: body.description, semester: body.semester, subjectSection: body.subjectSection, deadline: body.deadline, status: body.status }); return ok(projectDto(p)); }
        if (method === "delete") { p.archived = true; return ok({ message: "Project deleted successfully" }); }
      }
      if (rest === "/members") {
        if (method === "get") return ok(s.members.filter((x) => x.projectId === pid && x.active).map(memberDto));
        if (method === "post") { const mem = { id: id(), projectId: pid, userId: null, name: body.name, email: body.email, role: body.role || "Member", active: true }; s.members.push(mem); return ok(memberDto(mem), 201); }
      }
      if (rest === "/components") {
        if (method === "get") return ok(s.components.filter((x) => x.projectId === pid && !x.archived).map(componentDto));
        if (method === "post") {
          if (!body.dueDate) fail(400, "dueDate must not be null");
          const c = { id: id(), projectId: pid, name: body.name, description: body.description || null, type: "Other", status: body.status || "Pending", dueDate: body.dueDate, progress: body.progress || 0, ownerId: body.ownerId ?? null, archived: false };
          s.components.push(c); log(pid, "Component", `Added component "${c.name}"`, { componentId: c.id });
          return ok(componentDto(c), 201);
        }
      }
      if ((m = rest.match(/^\/components\/(\d+)(\/status)?$/))) {
        const c = s.components.find((x) => x.id === Number(m[1]) && x.projectId === pid && !x.archived);
        if (!c) fail(404, "Component not found in this project.");
        if (m[2] && method === "patch") {
          const before = c.status; c.status = body.status; if (c.status === "Approved") c.progress = 100;
          log(pid, "Status Change", `"${c.name}" changed from ${before} to ${c.status}`, { componentId: c.id, oldValue: before, newValue: c.status });
          return ok(componentDto(c));
        }
        if (method === "put") { Object.assign(c, { name: body.name, description: body.description, dueDate: body.dueDate, progress: body.progress, ownerId: body.ownerId }); return ok(componentDto(c)); }
        if (method === "delete") { c.archived = true; return ok({ message: "Component deleted successfully" }); }
      }
      if (rest === "/feedback") {
        if (method === "get") return ok(s.feedback.filter((f) => f.projectId === pid && (params?.includeSuperseded || f.status !== "Superseded")).map(feedbackDto));
        if (method === "post") {
          if (!s.components.find((c) => c.id === body.componentId && !c.archived)) fail(404, "Component not found in this project.");
          const f = { id: id(), projectId: pid, componentId: body.componentId, type: /clar/i.test(body.type || "") ? "Clarification" : "Feedback", text: body.text, givenBy: body.givenBy || p.adviser, receivedOn: today(), status: "Open", version: 1, previousFeedbackId: null, recordedBy: "Ana Reyes", createdAt: now(), resolvedAt: null };
          s.feedback.push(f); log(pid, "Feedback", `Feedback recorded: ${f.text}`, { componentId: f.componentId, feedbackId: f.id });
          return ok(feedbackDto(f), 201);
        }
      }
      if ((m = rest.match(/^\/feedback\/(\d+)\/(revise|status|replies|tasks)$/))) {
        const f = s.feedback.find((x) => x.id === Number(m[1]) && x.projectId === pid);
        if (!f) fail(404, "Feedback not found in this project.");
        if (m[2] === "revise") {
          if (f.status === "Superseded") fail(400, "This feedback was already replaced by a newer version. Revise the latest version.");
          const next = { ...f, id: id(), text: body.text, status: "Open", version: f.version + 1, previousFeedbackId: f.id, receivedOn: today(), createdAt: now() };
          f.status = "Superseded"; s.feedback.push(next);
          log(pid, "Feedback", `Instructions changed (version ${f.version} → ${next.version})`, { componentId: f.componentId, feedbackId: next.id });
          return ok({ feedback: feedbackDto(next), tasks: [], replies: [], versions: [] }, 201);
        }
        if (m[2] === "status") { f.status = body.status; return ok(feedbackDto(f)); }
        if (m[2] === "replies") { const r = { id: id(), feedbackId: f.id, author: "Ana Reyes", text: body.text, createdAt: now() }; s.replies.push(r); return ok(r, 201); }
        if (m[2] === "tasks" && method === "post") {
          if (f.status === "Superseded") fail(400, "That feedback was replaced by a newer version. Link the task to the latest version.");
          const t = { id: id(), projectId: pid, componentId: f.componentId, feedbackId: f.id, title: body.title, description: null, status: body.status || "To Do", assigneeId: body.assigneeId ?? null, dueDate: body.dueDate ?? null, archived: false };
          s.tasks.push(t); log(pid, "Task", `Created task "${t.title}"`, { componentId: t.componentId, feedbackId: f.id, taskId: t.id });
          return ok(taskDto(t), 201);
        }
      }
      if (rest === "/tasks") {
        if (method === "get") return ok(s.tasks.filter((t) => t.projectId === pid && !t.archived).map(taskDto));
        if (method === "post") {
          const t = { id: id(), projectId: pid, componentId: body.componentId, feedbackId: null, title: body.title, description: null, status: body.status || "To Do", assigneeId: body.assigneeId ?? null, dueDate: body.dueDate ?? null, archived: false };
          s.tasks.push(t); return ok(taskDto(t), 201);
        }
      }
      if ((m = rest.match(/^\/tasks\/(\d+)\/status$/)) && method === "patch") {
        const t = s.tasks.find((x) => x.id === Number(m[1])); t.status = body.status; return ok(taskDto(t));
      }
      if (rest === "/history" && method === "get") return ok(s.history.filter((h) => h.projectId === pid));
      if (rest === "/revisions" && method === "post") {
        const h = log(pid, "Revision", `Revision: ${body.summary}`, { feedbackId: body.feedbackId, componentId: s.feedback.find((f) => f.id === body.feedbackId)?.componentId ?? body.componentId });
        return ok(s.history[0], 201);
      }
    }
    fail(404, `fake server has no route for ${method.toUpperCase()} ${url}`);
  }

  api.defaults.adapter = async (config) => {
    s.requests.push({ method: config.method, url: config.url, headers: { ...config.headers } });
    if (s.failNext) { const f = s.failNext; s.failNext = null; fail(f.status, f.error); }
    const body = config.data ? JSON.parse(config.data) : undefined;
    const res = route(config.method, config.url, body, config.params);
    return { ...res, statusText: "OK", headers: {}, config };
  };

  return s;
}
