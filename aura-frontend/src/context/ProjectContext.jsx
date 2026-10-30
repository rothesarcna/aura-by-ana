import { createContext, useContext, useEffect, useState } from "react";
import { seed, defaultSettings } from "../data/mockData";
import { getCurrentUser } from "../services/authService";

const DATA_KEY = "aura_project_data";
const SETTINGS_KEY = "aura_settings";
const Ctx = createContext(null);

const load = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const uid = () => Math.random().toString(36).slice(2, 9);
const sha = () => Math.random().toString(16).slice(2, 9);
const now = () => new Date().toISOString();

export function ProjectProvider({ children }) {
  const [user, setUser] = useState(getCurrentUser);
  const [data, setData] = useState(() => load(DATA_KEY, seed));
  const [settings, setSettings] = useState(() => {
    const s = load(SETTINGS_KEY, {});
    return {
      ...defaultSettings,
      ...s,
      notify: { ...defaultSettings.notify, ...s.notify },
      privacy: { ...defaultSettings.privacy, ...s.privacy },
    };
  });

  useEffect(() => localStorage.setItem(DATA_KEY, JSON.stringify(data)), [data]);
  useEffect(() => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)), [settings]);

  const author = user?.fullName || "You";

  // Adds a "commit" to the revision history (like a Git commit).
  const commit = (d, entry) => ({
    ...d,
    history: [
      { id: uid(), hash: sha(), author, date: now(), changes: { added: 0, removed: 0 }, ...entry },
      ...d.history,
    ],
  });

  const actions = {
    addFeedback: ({ componentId, type, text, givenBy }) =>
      setData((d) =>
        commit(
          {
            ...d,
            feedback: [
              { id: uid(), componentId, type, text, author: givenBy || author, date: now(), status: "Open", replies: [] },
              ...d.feedback,
            ],
          },
          {
            message: `${type === "clarification" ? "Requested clarification" : "Recorded feedback"}: ${text.slice(0, 60)}`,
            componentId,
            type: "feedback",
          }
        )
      ),

    setFeedbackStatus: (id, status) =>
      setData((d) => ({ ...d, feedback: d.feedback.map((f) => (f.id === id ? { ...f, status } : f)) })),

    addReply: (id, text) =>
      setData((d) => ({
        ...d,
        feedback: d.feedback.map((f) =>
          f.id === id ? { ...f, replies: [...f.replies, { id: uid(), author, text, date: now() }] } : f
        ),
      })),

    addFile: (file) =>
      setData((d) =>
        commit(
          { ...d, files: [{ id: uid(), addedBy: author, date: now(), ...file }, ...d.files] },
          { message: `Added ${file.kind}: ${file.name}`, componentId: file.componentId, type: "change", changes: { added: 1, removed: 0 } }
        )
      ),

    removeFile: (id) => setData((d) => ({ ...d, files: d.files.filter((f) => f.id !== id) })),

    setFileComponent: (id, componentId) =>
      setData((d) => ({ ...d, files: d.files.map((f) => (f.id === id ? { ...f, componentId } : f)) })),

    setRevisionStatus: (id, status) =>
      setData((d) => {
        const rev = d.revisions.find((r) => r.id === id);
        if (!rev) return d;
        return commit(
          {
            ...d,
            revisions: d.revisions.map((r) => (r.id === id ? { ...r, status } : r)),
            components: d.components.map((c) => (c.id === rev.componentId ? { ...c, status } : c)),
          },
          {
            message: `${rev.title} → ${status}`,
            componentId: rev.componentId,
            type: status === "Approved" ? "approval" : status === "Submitted" ? "submission" : "revision",
          }
        );
      }),

    toggleTask: (revId, taskId) =>
      setData((d) => ({
        ...d,
        revisions: d.revisions.map((r) =>
          r.id === revId
            ? { ...r, tasks: r.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
            : r
        ),
      })),

    requestApproval: (componentId) =>
      setData((d) =>
        commit(
          { ...d, components: d.components.map((c) => (c.id === componentId ? { ...c, approval: "Pending" } : c)) },
          { message: "Requested adviser approval", componentId, type: "approval" }
        )
      ),

    setTaskStatus: (id, status) =>
      setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, status } : t)) })),

    markRead: (id) =>
      setData((d) => ({ ...d, notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

    markAllRead: (category) =>
      setData((d) => ({
        ...d,
        notifications: d.notifications.map((n) => (!category || n.category === category ? { ...n, read: true } : n)),
      })),

    resetData: () => setData(seed),
  };

  const updateSettings = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const updateNested = (group, key, value) =>
    setSettings((s) => ({ ...s, [group]: { ...s[group], [key]: value } }));

  const compName = (id) => data.components.find((c) => c.id === id)?.name ?? "General (no component)";

  return (
    <Ctx.Provider value={{ user, setUser, data, settings, updateSettings, updateNested, actions, compName }}>
      {children}
    </Ctx.Provider>
  );
}

export const useProject = () => useContext(Ctx);