import { api } from "./apiClient";

/*
 * Talks to the Spring Boot project API and converts its responses into the shapes the pages already use
 * (string ids, "due" instead of "dueDate", lowercase feedback types, ...), so the pages do not need to
 * know whether the data came from the server or from localStorage.
 */

const sid = (v) => (v === null || v === undefined ? "" : String(v));
export const toNumber = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
const data = (promise) => promise.then((r) => r.data);

/* ---------------------------- response -> UI shape ---------------------------- */

// The backend has no separate "approval" field: an adviser decision is a component status.
const APPROVAL_FOR_STATUS = {
  Pending: "Not Requested",
  Submitted: "Pending",
  "Under Review": "Pending",
  Resubmitted: "Pending",
  "For Revision": "Rejected",
  Approved: "Approved",
};

export const mapProject = (p) => ({
  id: sid(p.id),
  title: p.title,
  type: p.type || "",
  startDate: p.startDate || "",
  status: p.status || "Pending",
  description: p.description || "",
  semester: p.semester || "",
  subjectSection: p.subjectSection || "",
  professor: p.professor || p.adviser || "",
  deadline: p.deadline || "",
  members: (p.members || []).map((m) => m.name),
  progress: p.progress || 0,
  ownerId: sid(p.ownerId),
  openTaskCount: p.openTaskCount || 0,
  unresolvedFeedbackCount: p.unresolvedFeedbackCount || 0,
});

export const mapComponent = (c) => ({
  id: sid(c.id),
  name: c.name,
  description: c.description || "",
  type: c.type,
  status: c.status,
  approval: APPROVAL_FOR_STATUS[c.status] ?? "Not Requested",
  progress: c.progress || 0,
  due: c.dueDate || "",
  owner: sid(c.ownerId),
  overdue: !!c.overdue,
});

export const mapFeedback = (f) => ({
  id: sid(f.id),
  componentId: sid(f.componentId),
  type: String(f.type || "Feedback").toLowerCase(),
  status: f.status,
  author: f.givenBy || f.recordedBy || "",
  date: f.receivedOn || f.createdAt,
  text: f.text,
  version: f.version || 1,
  previousFeedbackId: sid(f.previousFeedbackId),
  supersededById: sid(f.supersededById),
  replies: (f.replies || []).map((r) => ({ id: sid(r.id), author: r.author, date: r.createdAt, text: r.text })),
});

export const mapTask = (t) => ({
  id: sid(t.id),
  title: t.title,
  description: t.description || "",
  assignee: sid(t.assigneeId),
  componentId: sid(t.componentId),
  feedbackId: sid(t.feedbackId),
  status: t.status,
  due: t.dueDate || "",
  overdue: !!t.overdue,
});

export const mapMember = (m) => ({
  id: sid(m.id),
  name: m.name,
  role: m.role || "Member",
  email: m.email || "",
  userId: sid(m.userId),
  responsibilities: [],
});

const historyKind = (h) => {
  if (h.type === "Revision") return "revision";
  if (h.type === "Feedback") return "feedback";
  if (h.type === "Status Change") {
    if (h.newValue === "Approved") return "approval";
    if (h.newValue === "Submitted" || h.newValue === "Resubmitted") return "submission";
  }
  return "change";
};

export const mapHistory = (h) => ({
  id: sid(h.id),
  hash: Number(h.id).toString(16).padStart(7, "0"),
  type: historyKind(h),
  message: h.message,
  author: h.actorName || "System",
  date: h.createdAt,
  componentId: sid(h.componentId),
  feedbackId: sid(h.feedbackId),
  changes: { added: 0, removed: 0 },
});

/**
 * The Revisions pages show one card per component: its status plus a checklist of that component's
 * revision tasks. Moving the card moves the component; ticking a box completes the task.
 */
export const deriveRevisions = (components, tasks) =>
  components.map((c) => ({
    id: c.id,
    componentId: c.id,
    title: `${c.name} – Revision`,
    status: c.status,
    tasks: tasks.filter((t) => t.componentId === c.id).map((t) => ({ id: t.id, text: t.title, done: t.status === "Done" })),
  }));

/* -------------------------------- requests -------------------------------- */

const P = (projectId) => `/projects/${projectId}`;

export const projectApi = {
  listProjects: () => data(api.get("/projects")).then((list) => list.map(mapProject)),
  getProject: (id) => data(api.get(P(id))).then(mapProject),
  createProject: (body) => data(api.post("/projects", body)).then(mapProject),
  updateProject: (id, body) => data(api.put(P(id), body)).then(mapProject),
  deleteProject: (id) => data(api.delete(P(id))),

  async loadWorkspace(projectId) {
    const [components, feedback, tasks, members, history] = await Promise.all([
      data(api.get(`${P(projectId)}/components`)),
      data(api.get(`${P(projectId)}/feedback`, { params: { includeSuperseded: true } })),
      data(api.get(`${P(projectId)}/tasks`)),
      data(api.get(`${P(projectId)}/members`)),
      data(api.get(`${P(projectId)}/history`)),
    ]);
    return {
      components: components.map(mapComponent),
      feedbackAll: feedback.map(mapFeedback),
      tasks: tasks.map(mapTask),
      members: members.map(mapMember),
      history: history.map(mapHistory),
    };
  },

  listMembers: (projectId) => data(api.get(`${P(projectId)}/members`)).then((l) => l.map(mapMember)),
  addMember: (projectId, body) => data(api.post(`${P(projectId)}/members`, body)).then(mapMember),
  removeMember: (projectId, memberId) => data(api.delete(`${P(projectId)}/members/${memberId}`)),

  createComponent: (projectId, body) => data(api.post(`${P(projectId)}/components`, body)).then(mapComponent),
  updateComponent: (projectId, id, body) => data(api.put(`${P(projectId)}/components/${id}`, body)).then(mapComponent),
  setComponentStatus: (projectId, id, status, note) =>
    data(api.patch(`${P(projectId)}/components/${id}/status`, { status, note })).then(mapComponent),
  deleteComponent: (projectId, id) => data(api.delete(`${P(projectId)}/components/${id}`)),

  createFeedback: (projectId, body) => data(api.post(`${P(projectId)}/feedback`, body)).then(mapFeedback),
  reviseFeedback: (projectId, id, body) =>
    data(api.post(`${P(projectId)}/feedback/${id}/revise`, body)).then((d) => mapFeedback(d.feedback)),
  setFeedbackStatus: (projectId, id, status) =>
    data(api.patch(`${P(projectId)}/feedback/${id}/status`, { status })).then(mapFeedback),
  addReply: (projectId, id, text) => data(api.post(`${P(projectId)}/feedback/${id}/replies`, { text })),

  createTask: (projectId, body) => data(api.post(`${P(projectId)}/tasks`, body)).then(mapTask),
  createFeedbackTask: (projectId, feedbackId, body) =>
    data(api.post(`${P(projectId)}/feedback/${feedbackId}/tasks`, body)).then(mapTask),
  setTaskStatus: (projectId, id, status) => data(api.patch(`${P(projectId)}/tasks/${id}/status`, { status })).then(mapTask),
  deleteTask: (projectId, id) => data(api.delete(`${P(projectId)}/tasks/${id}`)),

  recordRevision: (projectId, body) => data(api.post(`${P(projectId)}/revisions`, body)).then(mapHistory),
};
