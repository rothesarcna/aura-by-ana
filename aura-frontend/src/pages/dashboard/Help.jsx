import { useState } from "react";
import { Card, StatusBadge } from "../../components/ui";
import { STATUSES } from "../../data/mockData";

const GUIDES = {
  "getting-started": {
    intro: "AURA turns adviser feedback into clear revision tasks so you always know what to do next.",
    steps: [
      "Open Overview to see your project summary, pending actions, and deadlines.",
      "Check Components to see every part of your project and its status.",
      "Record feedback from your adviser under Feedback & Issues.",
      "Work through revision tasks under Revision Reviews, then resubmit.",
      "Track every change in Revision History.",
    ],
  },
  "manage-projects": {
    intro: "A project is split into components (chapters, diagrams, prototype, slides).",
    steps: [
      "Open Components → Component List to see all components.",
      "Click Details to see the files, feedback, and revisions linked to one component.",
      "Use Component Status to see components grouped by status.",
      "Attach files and links to a component from Files & Links.",
      "Use Team to assign tasks and track who is doing what.",
    ],
  },
  "record-feedback": {
    intro: "Record feedback as soon as you receive it so nothing gets lost.",
    steps: [
      "Go to Feedback & Issues → Add Feedback.",
      "Choose the component the feedback is about.",
      "Type the feedback exactly as given and who gave it.",
      "Save. It appears in All Feedback and Unresolved Issues.",
      "When you have addressed it, open Feedback Details and click Mark as resolved.",
    ],
  },
  "manage-revisions": {
    intro: "Each revision has a checklist of tasks that come from the feedback.",
    steps: [
      "Open Revision Reviews → For Revision.",
      "Tick each task as you finish it.",
      "When all tasks are done, click Resubmit.",
      "The revision moves to Resubmitted, and the adviser reviews it again.",
      "Every status change is saved in Revision History.",
    ],
  },
  "request-clarification": {
    intro: "If feedback is unclear, ask before you revise.",
    steps: [
      "Go to Feedback & Issues → Add Feedback.",
      "Set the type to Clarification request.",
      "Write a specific question (what you understood and what you are unsure about).",
      "Track the answer in Clarification Requests and reply in Feedback Details.",
    ],
  },
  "approval-workflow": {
    intro: "A component is only complete when the adviser approves it.",
    steps: [
      "Finish all revision tasks for the component.",
      "Open Components → Adviser Approval Status and click Request approval.",
      "The adviser reviews it and sets it to Approved or Rejected.",
      "If rejected, new feedback is recorded and the cycle repeats.",
      "Approved components count toward your project progress.",
    ],
  },
};

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

export default function Help({ view }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "" });

  if (GUIDES[view]) {
    const g = GUIDES[view];
    return (
      <Card>
        <p>{g.intro}</p>
        <ol className="steps">{g.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      </Card>
    );
  }

  if (view === "statuses") {
    return (
      <Card>
        <table className="table">
          <thead><tr><th>Status</th><th>What it means</th></tr></thead>
          <tbody>
            {STATUSES.map((s) => (
              <tr key={s}><td><StatusBadge status={s} /></td><td>{MEANING[s]}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    );
  }

  if (view === "faq") {
    return (
      <Card>
        {FAQ.map(([q, a]) => (
          <details key={q} className="faq">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </Card>
    );
  }

  // contact
  return (
    <Card title="Contact support">
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
    </Card>
  );
}