import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useProject } from "../../context/ProjectContext";
import { Card, Empty, StatusBadge, formatDate } from "../../components/ui";

function FeedbackList({ items }) {
  const { compName } = useProject();
  if (!items.length) return <Card><Empty text="No items to show." /></Card>;
  return (
    <Card>
      {items.map((f) => (
        <Link key={f.id} to={`/dashboard/feedback/details?id=${f.id}`} className="feedback-row">
          <div className="fb-top">
            <StatusBadge status={f.type === "clarification" ? "Clarification" : "Feedback"} />
            <StatusBadge status={f.status} />
            <span className="chip">{compName(f.componentId)}</span>
          </div>
          <p>{f.text}</p>
          <small className="muted">{f.author} · {formatDate(f.date)} · {f.replies.length} repl{f.replies.length === 1 ? "y" : "ies"}</small>
        </Link>
      ))}
    </Card>
  );
}

function AddFeedback() {
  const { data, actions, user } = useProject();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    componentId: data.components[0].id,
    type: "feedback",
    givenBy: data.project.adviser,
    text: "",
  });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.text.trim()) return setError("Please write the feedback or question.");
    actions.addFeedback(form);
    navigate("/dashboard/feedback/all");
  };

  return (
    <Card title="Record new feedback">
      <form className="form" onSubmit={submit}>
        {error && <div className="alert error">{error}</div>}
        <label>Component
          <select value={form.componentId} onChange={set("componentId")}>
            {data.components.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Type
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value, givenBy: e.target.value === "clarification" ? user?.fullName || "" : data.project.adviser })}
          >
            <option value="feedback">Feedback received</option>
            <option value="clarification">Clarification request</option>
          </select>
        </label>
        <label>{form.type === "clarification" ? "Asked by" : "Given by"}
          <input value={form.givenBy} onChange={set("givenBy")} />
        </label>
        <label>Details
          <textarea rows={5} value={form.text} onChange={set("text")} placeholder="What needs to change, or what do you need clarified?" />
        </label>
        <button className="btn" type="submit">Save</button>
      </form>
    </Card>
  );
}

function FeedbackDetails() {
  const { data, actions, compName } = useProject();
  const [params, setParams] = useSearchParams();
  const [reply, setReply] = useState("");
  const f = data.feedback.find((x) => x.id === params.get("id")) || data.feedback[0];
  if (!f) return <Card><Empty text="No feedback recorded yet." /></Card>;

  const send = (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    actions.addReply(f.id, reply.trim());
    setReply("");
  };

  return (
    <>
      <div className="toolbar">
        <label>Feedback
          <select value={f.id} onChange={(e) => setParams({ id: e.target.value })}>
            {data.feedback.map((x) => <option key={x.id} value={x.id}>{x.text.slice(0, 60)}</option>)}
          </select>
        </label>
      </div>
      <Card
        title={compName(f.componentId)}
        action={
          <button className="btn small" onClick={() => actions.setFeedbackStatus(f.id, f.status === "Open" ? "Resolved" : "Open")}>
            {f.status === "Open" ? "Mark as resolved" : "Reopen"}
          </button>
        }
      >
        <div className="fb-top">
          <StatusBadge status={f.type === "clarification" ? "Clarification" : "Feedback"} />
          <StatusBadge status={f.status} />
        </div>
        <p className="fb-text">{f.text}</p>
        <small className="muted">{f.author} · {formatDate(f.date)}</small>

        <h4>Replies</h4>
        {f.replies.length === 0 && <Empty text="No replies yet." />}
        {f.replies.map((r) => (
          <div key={r.id} className="reply">
            <b>{r.author}</b> <small className="muted">{formatDate(r.date)}</small>
            <p>{r.text}</p>
          </div>
        ))}
        <form className="form inline" onSubmit={send}>
          <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" />
          <button className="btn" type="submit">Reply</button>
        </form>
      </Card>
    </>
  );
}

export default function Feedback({ view }) {
  const { data } = useProject();
  const { feedback } = data;
  if (view === "all") return <FeedbackList items={feedback} />;
  if (view === "add") return <AddFeedback />;
  if (view === "details") return <FeedbackDetails />;
  if (view === "clarifications") return <FeedbackList items={feedback.filter((f) => f.type === "clarification")} />;
  return <FeedbackList items={feedback.filter((f) => f.status === "Open")} />;
}