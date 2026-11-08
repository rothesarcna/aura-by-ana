import { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { Card, Empty, ProgressBar, formatDate } from "../../components/ui";

const TASK_STATUSES = ["To Do", "In Progress", "Needs Clarification", "Done"];

function AddMember() {
  const { actions } = useProject();
  const [form, setForm] = useState({ name: "", role: "", email: "" });
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Enter the member's name.");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return setError("Enter a valid email or leave it blank.");
    actions.addMember({ name: form.name, role: form.role.trim() || "Member", email: form.email.trim() });
    setForm({ name: "", role: "", email: "" });
    setError("");
  };

  return (
    <Card title="Add team member">
      <form className="form row" onSubmit={submit}>
        {error && <div className="alert error full">{error}</div>}
        <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>Role<input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Researcher" /></label>
        <label>Email (optional)<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <button className="btn" type="submit">Add</button>
      </form>
    </Card>
  );
}

function AddTask() {
  const { data, actions } = useProject();
  const [form, setForm] = useState({ title: "", assignee: "", componentId: "", due: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const componentId = form.componentId || data.components[0]?.id;
    if (!form.title.trim()) return setError("Describe the task.");
    if (!componentId) return setError("Add a component first, then assign tasks for it.");
    const result = await actions.addTask({ ...form, componentId });
    if (result !== null) setForm({ title: "", assignee: "", componentId: "", due: "" });
    setError("");
  };

  return (
    <Card title="Assign a task">
      <form className="form row" onSubmit={submit}>
        {error && <div className="alert error full">{error}</div>}
        <label className="full">Task<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label>Assign to
          <select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
            <option value="">— Unassigned —</option>
            {data.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label>Component
          <select value={form.componentId || data.components[0]?.id || ""} onChange={(e) => setForm({ ...form, componentId: e.target.value })}>
            {data.components.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Deadline<input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></label>
        <button className="btn" type="submit">Add task</button>
      </form>
    </Card>
  );
}

function AddResponsibility({ memberId }) {
  const { actions } = useProject();
  const [text, setText] = useState("");
  return (
    <form
      className="form inline"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        actions.addResponsibility(memberId, text.trim());
        setText("");
      }}
    >
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add responsibility…" />
      <button className="btn ghost small" type="submit">Add</button>
    </form>
  );
}

export default function Team({ view }) {
  const { data, actions, compName, memberName } = useProject();
  const { members, tasks } = data;

  if (view === "members") {
    return (
      <>
        <div className="grid-3">
          {members.length === 0 && <Card><Empty text="No members yet." /></Card>}
          {members.map((m) => (
            <Card key={m.id}>
              <div className="member">
                <span className="avatar big">{m.name[0]}</span>
                <div>
                  <strong>{m.name}</strong>
                  <div className="muted">{m.role}</div>
                  {m.email && <small>{m.email}</small>}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <AddMember />
      </>
    );
  }

  if (view === "tasks") {
    return (
      <>
        <AddTask />
        <Card title="Assigned tasks">
          {tasks.length === 0 ? (
            <Empty text="No tasks yet." />
          ) : (
            <table className="table">
              <thead><tr><th>Task</th><th>Assigned to</th><th>Component</th><th>Due</th><th>Status</th><th /></tr></thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{memberName(t.assignee)}</td>
                    <td>{compName(t.componentId)}</td>
                    <td>{formatDate(t.due)}</td>
                    <td>
                      <select value={t.status} onChange={(e) => actions.setTaskStatus(t.id, e.target.value)}>
                        {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <button className="btn ghost small danger" aria-label="Delete task" onClick={() => actions.deleteTask(t.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </>
    );
  }

  if (view === "responsibilities") {
    return (
      <div className="grid-3">
        {members.length === 0 && <Card><Empty text="No members yet." /></Card>}
        {members.map((m) => (
          <Card key={m.id} title={m.name}>
            <div className="muted">{m.role}</div>
            <ul className="bullets">{m.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul>
            <AddResponsibility memberId={m.id} />
          </Card>
        ))}
      </div>
    );
  }

  // progress
  const done = tasks.filter((t) => t.status === "Done").length;
  const overall = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return (
    <>
      <Card title="Overall completion">
        <div className="big-number">{overall}%</div>
        <ProgressBar value={overall} />
        <small className="muted">{done} of {tasks.length} tasks done</small>
      </Card>
      <Card title="By member">
        {members.map((m) => {
          const mine = tasks.filter((t) => t.assignee === m.id);
          const d = mine.filter((t) => t.status === "Done").length;
          const pct = mine.length ? Math.round((d / mine.length) * 100) : 0;
          return (
            <div key={m.id} className="bar-row">
              <span>{m.name}</span>
              <ProgressBar value={pct} />
              <b>{d}/{mine.length}</b>
            </div>
          );
        })}
      </Card>
    </>
  );
}