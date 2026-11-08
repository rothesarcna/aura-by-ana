import { useState } from "react";
import { Link } from "react-router-dom";
import { useProject } from "../../context/ProjectContext";
import { Card, Empty, StatusBadge } from "../../components/ui";

const VIEW_STATUS = {
  pending: "Pending",
  submitted: "Submitted",
  "under-review": "Under Review",
  "for-revision": "For Revision",
  resubmitted: "Resubmitted",
  approved: "Approved",
};

// Allowed next steps for each status
const NEXT = {
  Pending: [["Submit", "Submitted"]],
  Submitted: [["Start review", "Under Review"]],
  "Under Review": [["Request revision", "For Revision"], ["Approve", "Approved"]],
  "For Revision": [["Resubmit", "Resubmitted"]],
  Resubmitted: [["Start review", "Under Review"]],
  Approved: [],
};

function NewRevision() {
  const { data, actions } = useProject();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ componentId: "", title: "", tasks: "" });
  const [error, setError] = useState("");

  if (!open) {
    return (
      <div className="toolbar">
        <button className="btn" onClick={() => setOpen(true)}>+ New revision</button>
      </div>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    const componentId = form.componentId || data.components[0]?.id;
    if (!componentId) return setError("Add a component first.");
    if (!form.title.trim()) return setError("Give the revision a title.");
    actions.addRevision({
      componentId,
      title: form.title.trim(),
      tasks: form.tasks.split("\n").map((t) => t.trim()).filter(Boolean),
    });
    setForm({ componentId: "", title: "", tasks: "" });
    setError("");
    setOpen(false);
  };

  return (
    <Card title="New revision">
      <form className="form row" onSubmit={submit}>
        {error && <div className="alert error full">{error}</div>}
        <label>Component
          <select value={form.componentId || data.components[0]?.id || ""} onChange={(e) => setForm({ ...form, componentId: e.target.value })}>
            {data.components.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Title
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 2 – Revision 3" />
        </label>
        <label className="full">Revision tasks (one per line)
          <textarea rows={3} value={form.tasks} onChange={(e) => setForm({ ...form, tasks: e.target.value })} />
        </label>
        <div className="btn-row full" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button type="submit" className="btn">Create revision</button>
        </div>
      </form>
    </Card>
  );
}

function AddTask({ revisionId }) {
  const { actions } = useProject();
  const [text, setText] = useState("");
  return (
    <form
      className="form inline"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        actions.addRevisionTask(revisionId, text.trim());
        setText("");
      }}
    >
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a revision task…" />
      <button className="btn ghost small" type="submit">Add</button>
    </form>
  );
}

export default function Revisions({ view }) {
  const { data, actions, compName } = useProject();
  const status = VIEW_STATUS[view];
  const items = data.revisions.filter((r) => r.status === status);

  return (
    <>
      <NewRevision />
      {!items.length && <Card><Empty text={`No revisions are currently "${status}".`} /></Card>}
      {items.map((r) => {
        const allDone = r.tasks.every((t) => t.done);
        const blocked = r.status === "For Revision" && !allDone;
        return (
          <Card key={r.id} title={r.title} action={<StatusBadge status={r.status} />}>
            <p className="muted">
              Component: <Link to={`/dashboard/components/details?id=${r.componentId}`}>{compName(r.componentId)}</Link>
            </p>
            <h4>Revision tasks ({r.tasks.filter((t) => t.done).length}/{r.tasks.length})</h4>
            {r.tasks.length === 0 && <Empty text="No tasks yet." />}
            {r.tasks.map((t) => (
              <label key={t.id} className={`task ${t.done ? "done" : ""}`}>
                <input type="checkbox" checked={t.done} onChange={() => actions.toggleTask(r.id, t.id)} />
                {t.text}
              </label>
            ))}
            <AddTask revisionId={r.id} />
            <div className="btn-row">
              {NEXT[r.status].map(([label, next]) => (
                <button
                  key={next}
                  className="btn small"
                  disabled={blocked}
                  title={blocked ? "Finish all tasks first" : ""}
                  onClick={() => actions.setRevisionStatus(r.id, next)}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>
        );
      })}
    </>
  );
}
