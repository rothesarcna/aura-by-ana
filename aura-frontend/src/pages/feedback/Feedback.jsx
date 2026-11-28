import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useProject } from "../../context/ProjectContext";
import { Card, EMPTY_FILTER, Empty, FilterBar, StatusBadge, formatDate, inDates } from "../../components/ui";
import { projectApi } from "../../services/projectApi";

const TASK_STATUSES = ["To Do", "In Progress", "Needs Clarification", "Done"];

function FeedbackList({ items }) {
  const { compName, data } = useProject();
  const linked = (id) => (data.tasks || []).some((t) => t.feedbackId === id);
  if (!items.length) return <Card><Empty text="No items to show." /></Card>;
  return (
    <Card>
      {items.map((f) => (
        <Link key={f.id} to={`/dashboard/feedback/details?id=${f.id}`} className="feedback-row">
          <div className="fb-top">
            <StatusBadge status={f.type === "clarification" ? "Clarification" : "Feedback"} />
            <StatusBadge status={f.status} />
            {f.version > 1 && <span className="chip">v{f.version}</span>}
            <span className="chip">{compName(f.componentId)}</span>
            {f.possibleConflicts?.length > 0 && (
              <span className="chip" style={{ background: "#fee2e2", color: "#991b1b" }}>May conflict with other feedback</span>
            )}
            {f.type === "feedback" && f.status === "Open" && !linked(f.id) && (
              <span className="chip" style={{ background: "#fef3c7", color: "#92400e" }}>No next action yet</span>
            )}
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
    componentId: data.components[0]?.id ?? "",
    type: "feedback",
    givenBy: data.project.adviser || "",
    text: "",
  });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.componentId) return setError("Add a component first, then record feedback for it.");
    if (!form.text.trim()) return setError("Please write the feedback or question.");
    // Server mode returns a promise (null if the save failed); offline mode saves immediately.
    const result = actions.addFeedback(form);
    if (result instanceof Promise && (await result) === null) return;
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
            onChange={(e) => setForm({ ...form, type: e.target.value, givenBy: e.target.value === "clarification" ? user?.fullName || "" : data.project.adviser || "" })}
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

// All versions of one feedback item, oldest first (follows the links between versions in both directions)
function versionsOf(f, all) {
  const byId = new Map(all.map((x) => [x.id, x]));
  let first = f;
  while (first.previousFeedbackId && byId.get(first.previousFeedbackId)) first = byId.get(first.previousFeedbackId);
  const chain = [];
  for (let cur = first; cur && !chain.includes(cur); cur = cur.supersededById ? byId.get(cur.supersededById) : null) chain.push(cur);
  return chain;
}

// Next Action System: turn one feedback item into trackable tasks
function NextActions({ feedback, chainIds, readOnly }) {
  const { data, actions, memberName } = useProject();
  const [form, setForm] = useState({ title: "", assignee: "", due: "", priority: "Medium" });
  const [error, setError] = useState("");
  const mine = (data.tasks || []).filter((t) => chainIds.includes(t.feedbackId));
  

  const add = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Describe the action to take.");
    const result = await actions.addTask({ ...form, componentId: feedback.componentId, feedbackId: feedback.id });
    if (result !== null) setForm({ title: "", assignee: "", due: "", priority: "Medium" });
    setError("");
  };

  return (
    <Card title={`Next actions (${mine.filter((t) => t.status === "Done").length}/${mine.length} done)`}>
      {mine.length === 0 && <Empty text={readOnly ? "No actions were linked to this version." : "No next action yet. Turn this feedback into a specific task below."} />}
      {mine.map((t) => (
        <div key={t.id} className="list-row" style={{ gap: 10 }}>
          <span>
            {t.title}
            <small className="muted" style={{ display: "block" }}>
              {t.priority} · {memberName(t.assignee)} · due {formatDate(t.due)}
              {t.feedbackId !== feedback.id && " · linked to an earlier version"}
            </small>
          </span>
          <select value={t.status} onChange={(e) => actions.setTaskStatus(t.id, e.target.value)}>
            {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      ))}
      {!readOnly && (
        <form className="form row" onSubmit={add}>
          {error && <div className="alert error full">{error}</div>}
          <label className="full">New action
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Rewrite the objectives to be specific and measurable"
            />
          </label>
          <label>Assign to
            <select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
              <option value="">— Unassigned —</option>
              {data.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label>Priority
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {["Low", "Medium", "High", "Urgent"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <button className="btn" type="submit">Add action</button>
        </form>
      )}
    </Card>
  );
}

// Document what the group changed in response to this feedback (kept in Revision History)
function ChangesMade({ feedback, chainIds }) {
  const { data, actions } = useProject();
  const [text, setText] = useState("");
  const recorded = (data.history || []).filter((h) => h.type === "revision" && chainIds.includes(h.feedbackId));

  const save = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const result = await actions.recordRevision({ feedbackId: feedback.id, componentId: feedback.componentId, summary: text });
    if (result !== null) setText("");
  };

  return (
    <Card title="Changes made for this feedback">
      {recorded.length === 0 && <Empty text="No changes recorded yet." />}
      {recorded.map((h) => (
        <div key={h.id} className="reply">
          <b>{h.author}</b> <small className="muted">{formatDate(h.date)}</small>
          <p>{h.message}</p>
        </div>
      ))}
      <form className="form inline" onSubmit={save}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you change in response?" />
        <button className="btn" type="submit">Record change</button>
      </form>
    </Card>
  );
}

// The instructor changed their instructions: the old text stays on file, the new text becomes a new version
function ReviseFeedback({ feedback, onRevised }) {
  const { actions } = useProject();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(feedback.text);
  const [reason, setReason] = useState("");

  if (!open) {
    return <button className="btn ghost small" onClick={() => setOpen(true)}>Instructions changed?</button>;
  }

  const save = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const next = await actions.reviseFeedback(feedback.id, { text, reason });
    if (next && next.id) {
      onRevised(next.id);
      setOpen(false);
      setReason("");
    }
  };

  return (
    <form className="form" onSubmit={save}>
      <label>New instructions
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <label>Why did they change? (optional)
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Adviser emailed an update after the consultation" />
      </label>
      <small className="muted">The current text is kept as version {feedback.version || 1} and this becomes version {(feedback.version || 1) + 1}.</small>
      <div className="btn-row">
        <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
        <button type="submit" className="btn">Save as new version</button>
      </div>
    </form>
  );
}

// Flag an existing feedback record as unclear/conflicting and send the question to the instructor
function FlagUnclear({ feedback }) {
  const { actions, user } = useProject();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");

  if (!open) {
    return <button type="button" className="btn ghost small" onClick={() => setOpen(true)}>Flag as unclear</button>;
  }

  const save = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    const result = await actions.addFeedback({
      componentId: feedback.componentId,
      type: "clarification",
      givenBy: user?.fullName || "",
      text: question,
      clarifiesFeedbackId: feedback.id,
    });
    if (result !== null) {
      setQuestion("");
      setOpen(false);
    }
  };

  return (
    <form className="form inline" onSubmit={save}>
      <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What is unclear or conflicting?" />
      <button className="btn small" type="submit">Send question</button>
    </form>
  );
}

// AI assistant. Every suggestion can be edited, accepted or rejected.
function Assistant() {
  const { data, remote } = useProject();
  const [suggestion, setSuggestion] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!remote) return null;

  const ask = async (mode) => {
    setBusy(true);
    setError("");
    try {
      const result = await projectApi.askAssistant(data.project.id, mode);
      setSuggestion(result);
      setText(result.text);
    } catch {
      setError("The assistant is not available right now.");
    } finally {
      setBusy(false);
    }
  };

  const review = async (status) => {
    try {
      setSuggestion(await projectApi.reviewSuggestion(data.project.id, suggestion.id, status, text));
    } catch {
      setError("Could not save your decision.");
    }
  };

  return (
    <Card title="Feedback assistant">
      <div className="btn-row">
        {[["summarize", "Summarize"], ["simplify", "Simplify"], ["patterns", "Find patterns"], ["plan", "Suggest actions"]].map(([mode, label]) => (
          <button key={mode} type="button" className="btn ghost small" disabled={busy} onClick={() => ask(mode)}>{label}</button>
        ))}
      </div>
      {error && <div className="alert error">{error}</div>}
      {suggestion && (
        <>
          <textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="btn-row">
            <button type="button" className="btn small" onClick={() => review("ACCEPTED")}>Accept</button>
            <button type="button" className="btn ghost small" onClick={() => review("EDITED")}>Save my edit</button>
            <button type="button" className="btn ghost small danger" onClick={() => review("REJECTED")}>Reject</button>
            <small className="muted">{suggestion.status}</small>
          </div>
        </>
      )}
    </Card>
  );
}

function FeedbackDetails() {
  const { data, actions, compName } = useProject();
  const [params, setParams] = useSearchParams();
  const [reply, setReply] = useState("");
  const f = data.feedbackHistory.find((x) => x.id === params.get("id")) || data.feedback[0];
  if (!f) return <Card><Empty text="No feedback recorded yet." /></Card>;

  const versions = versionsOf(f, data.feedbackHistory);
  const chainIds = versions.map((v) => v.id);
  const latest = versions[versions.length - 1];
  const superseded = f.status === "Superseded";
  const options = superseded ? [f, ...data.feedback] : data.feedback;

  const send = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    const result = await actions.addReply(f.id, reply.trim());
    if (result !== null) setReply("");
  };

  return (
    <>
      <div className="toolbar">
        <label>Feedback
          <select value={f.id} onChange={(e) => setParams({ id: e.target.value })}>
            {options.map((x) => <option key={x.id} value={x.id}>{x.text.slice(0, 60)}</option>)}
          </select>
        </label>
      </div>
      <Card
        title={compName(f.componentId)}
        action={
          !superseded && (
            <button className="btn small" onClick={() => actions.setFeedbackStatus(f.id, f.status === "Open" ? "Resolved" : "Open")}>
              {f.status === "Open" ? "Mark as resolved" : "Reopen"}
            </button>
          )
        }
      >
        <div className="fb-top">
          <StatusBadge status={f.type === "clarification" ? "Clarification" : "Feedback"} />
          <StatusBadge status={f.status} />
          {versions.length > 1 && <span className="chip">Version {f.version || 1} of {versions.length}</span>}
        </div>
        {superseded && (
          <div className="alert">
            The instructions were changed after this was recorded. This is kept as an earlier version.{" "}
            <button className="btn ghost small" onClick={() => setParams({ id: latest.id })}>View the latest version</button>
          </div>
        )}
        <p className="fb-text">{f.text}</p>
        <small className="muted">{f.author} · {formatDate(f.date)}</small>
        {!superseded && (
          <div className="btn-row">
            <ReviseFeedback key={f.id} feedback={f} onRevised={(id) => setParams({ id })} />
            {f.type === "feedback" && <FlagUnclear key={`u${f.id}`} feedback={f} />}
          </div>
        )}

        <h4>Replies &amp; clarifications</h4>
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

      {versions.length > 1 && (
        <Card title="Version history">
          {[...versions].reverse().map((v) => (
            <div key={v.id} className="reply" style={v.id === f.id ? { fontWeight: 600 } : undefined}>
              <b>Version {v.version || 1}</b> <StatusBadge status={v.status} /> <small className="muted">{v.author} · {formatDate(v.date)}</small>
              <p>{v.text}</p>
              {v.id !== f.id && <button className="btn ghost small" onClick={() => setParams({ id: v.id })}>Open this version</button>}
            </div>
          ))}
        </Card>
      )}

      <NextActions feedback={f} chainIds={chainIds} readOnly={superseded} />
      <ChangesMade feedback={f} chainIds={chainIds} />
    </>
  );
}

export default function Feedback({ view }) {
  const { data } = useProject();
  const { feedback } = data;
  const [f, setF] = useState(EMPTY_FILTER);

  // search text, status, date received, and "assigned to" (via the tasks linked to the feedback)
  const apply = (list) =>
    list.filter(
      (x) =>
        (!f.q || `${x.text} ${x.author}`.toLowerCase().includes(f.q.toLowerCase())) &&
        (!f.status || x.status === f.status) &&
        (!f.member || (data.tasks || []).some((t) => t.feedbackId === x.id && t.assignee === f.member)) &&
        inDates(x.date, f.from, f.to)
    );
  const bar = <FilterBar value={f} onChange={setF} statuses={["Open", "Resolved"]} members={data.members} dateLabel="Received" />;

  if (view === "add") return <AddFeedback />;
  if (view === "details") return <FeedbackDetails />;
  let items = feedback.filter((x) => x.status === "Open");
  if (view === "all") items = feedback;
  if (view === "clarifications") items = feedback.filter((x) => x.type === "clarification");
  return (
    <>
      {bar}
      <FeedbackList items={apply(items)} />
    </>
  );
}
