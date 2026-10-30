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

export default function Revisions({ view }) {
  const { data, actions, compName } = useProject();
  const status = VIEW_STATUS[view];
  const items = data.revisions.filter((r) => r.status === status);

  if (!items.length) return <Card><Empty text={`No revisions are currently "${status}".`} /></Card>;

  return (
    <>
      {items.map((r) => {
        const allDone = r.tasks.every((t) => t.done);
        return (
          <Card key={r.id} title={r.title} action={<StatusBadge status={r.status} />}>
            <p className="muted">
              Component: <Link to={`/dashboard/components/details?id=${r.componentId}`}>{compName(r.componentId)}</Link>
            </p>
            <h4>Revision tasks ({r.tasks.filter((t) => t.done).length}/{r.tasks.length})</h4>
            {r.tasks.map((t) => (
              <label key={t.id} className={`task ${t.done ? "done" : ""}`}>
                <input type="checkbox" checked={t.done} onChange={() => actions.toggleTask(r.id, t.id)} />
                {t.text}
              </label>
            ))}
            <div className="btn-row">
              {NEXT[r.status].map(([label, next]) => (
                <button
                  key={next}
                  className="btn small"
                  disabled={r.status === "For Revision" && !allDone}
                  title={r.status === "For Revision" && !allDone ? "Finish all tasks first" : ""}
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