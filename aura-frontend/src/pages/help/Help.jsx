import { useState } from "react";
import { StatusBadge } from "../../components/ui";
import { STATUSES } from "../../data/mockData";

/*
 * Help & Guide = ONE page of collapsible cards (no sub-pages, no tabs).
 * Click a card title to open or close it, or use Expand all / Collapse all.
 */

const GUIDES = [
  {
    id: "getting-started",
    title: "Getting Started",
    intro: "AURA turns adviser feedback into clear revision tasks so you always know what to do next.",
    steps: [
      "Open Dashboard to see your project summary, pending actions, and deadlines.",
      "Check Components to see every part of your project and its status.",
      "Record feedback from your adviser under Feedback & Issues.",
      "Work through revision tasks under Revision Reviews, then resubmit.",
      "Track every change in Revision History.",
    ],
  },
  {
    id: "manage-projects",
    title: "How to Manage Projects",
    intro: "A project is split into components (chapters, diagrams, prototype, slides).",
    steps: [
      "Open Components → Component List to see all components.",
      "Click Details to see the files, feedback, and revisions linked to one component.",
      "Use Component Status to see components grouped by status.",
      "Attach files and links to a component from Files & Links.",
      "Use Team to assign tasks and track who is doing what.",
    ],
  },
  {
    id: "record-feedback",
    title: "How to Record Feedback",
    intro: "Record feedback as soon as you receive it so nothing gets lost.",
    steps: [
      "Go to Feedback & Issues → Add Feedback.",
      "Choose the component the feedback is about.",
      "Type the feedback exactly as given and who gave it.",
      "Save. It appears in All Feedback and Unresolved Issues.",
      "When you have addressed it, open Feedback Details and click Mark as resolved.",
    ],
  },
  {
    id: "manage-revisions",
    title: "How to Manage Revisions",
    intro: "Each revision has a checklist of tasks that come from the feedback.",
    steps: [
      "Open Revision Reviews → For Revision.",
      "Tick each task as you finish it.",
      "When all tasks are done, click Resubmit.",
      "The revision moves to Resubmitted, and the adviser reviews it again.",
      "Every status change is saved in Revision History.",
    ],
  },
  {
    id: "request-clarification",
    title: "How to Request Clarification",
    intro: "If feedback is unclear, ask before you revise.",
    steps: [
      "Go to Feedback & Issues → Add Feedback.",
      "Set the type to Clarification request.",
      "Write a specific question (what you understood and what you are unsure about).",
      "Track the answer in Clarification Requests and reply in Feedback Details.",
    ],
  },
  {
    id: "approval-workflow",
    title: "Adviser Approval Workflow",
    intro: "A component is only complete when the adviser approves it.",
    steps: [
      "Finish all revision tasks for the component.",
      "Open Components → Adviser Approval Status and click Request approval.",
      "The adviser reviews it and sets it to Approved or Rejected.",
      "If rejected, new feedback is recorded and the cycle repeats.",
      "Approved components count toward your project progress.",
    ],
  },
];

const MEANING = {
  Pending: "Work has not been submitted yet.",
  Submitted: "Submitted and waiting for the adviser.",
  "Under Review": "The adviser is reviewing it.",
  "For Revision": "The adviser asked for changes. Finish the revision tasks.",
  Resubmitted: "You fixed the issues and submitted it again.",
  Approved: "The adviser accepted it. No more work needed.",
};

const FAQ = [
  ["What does AURA stand for?", "Academic Updates, Revisions, and Actions."],
  ["What is the Next Action System?", "It turns adviser feedback into clear revision tasks so you know exactly what to do next."],
  ["Can I resubmit before finishing all tasks?", "No. Resubmit is enabled only when every revision task is ticked."],
  ["Can I connect a file to more than one component?", "A file connects to one component at a time. Add a link to the same document if it belongs to several."],
  ["Where do I see what changed between versions?", "Revision History → Changes Made, or the Revision Timeline for a commit-style view."],
];

const SECTION_IDS = [...GUIDES.map((g) => g.id), "statuses", "faq", "contact"];

function HelpCard({ id, title, open, onToggle, children }) {
  return (
    <details className="help-card" open={!!open[id]} onToggle={(e) => onToggle(id, e.currentTarget.open)}>
      <summary>{title}</summary>
      <div className="help-body">{children}</div>
    </details>
  );
}

export default function Help() {
  const [open, setOpen] = useState({ "getting-started": true });
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "" });

  const toggle = (id, value) => setOpen((o) => (o[id] === value ? o : { ...o, [id]: value }));
  const setAll = (value) => setOpen(Object.fromEntries(SECTION_IDS.map((id) => [id, value])));

  return (
    <div className="help-page">
      <div className="page-head">
        <h1>Help &amp; Guide</h1>
        <p>Learn how to turn adviser feedback into clear revision tasks.</p>
      </div>

      <div className="btn-row" style={{ margin: "0 0 14px" }}>
        <button type="button" className="btn ghost small" onClick={() => setAll(true)}>Expand all</button>
        <button type="button" className="btn ghost small" onClick={() => setAll(false)}>Collapse all</button>
      </div>

      {GUIDES.map((g) => (
        <HelpCard key={g.id} id={g.id} title={g.title} open={open} onToggle={toggle}>
          <p>{g.intro}</p>
          <ol className="steps">{g.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </HelpCard>
      ))}

      <HelpCard id="statuses" title="Understanding Revision Statuses" open={open} onToggle={toggle}>
        <table className="table">
          <thead><tr><th>Status</th><th>What it means</th></tr></thead>
          <tbody>
            {STATUSES.map((s) => (
              <tr key={s}><td><StatusBadge status={s} /></td><td>{MEANING[s]}</td></tr>
            ))}
          </tbody>
        </table>
      </HelpCard>

      <HelpCard id="faq" title="Frequently Asked Questions" open={open} onToggle={toggle}>
        {FAQ.map(([q, a]) => (
          <details key={q} className="faq">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </HelpCard>

      <HelpCard id="contact" title="Contact Support" open={open} onToggle={toggle}>
        {sent ? (
          <div className="alert success">Message sent. We'll get back to you soon. (Demo: not actually sent yet.)</div>
        ) : (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.subject.trim() && form.message.trim()) setSent(true);
            }}
          >
            <label>Subject<input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
            <label>Message<textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
            <button className="btn" type="submit">Send</button>
          </form>
        )}
      </HelpCard>
    </div>
  );
}