import { Link } from "react-router-dom";
import { useProject } from "../../context/ProjectContext";
import { STATUSES } from "../../data/mockData";
import { Card, CommitRow, Empty, ProgressBar, Stat, StatusBadge, daysUntil, formatDate } from "../../components/ui";

export default function Overview({ view }) {
  const { data } = useProject();
  const { project, components, history, revisions, feedback } = data;
  const overall = Math.round(components.reduce((s, c) => s + c.progress, 0) / components.length);

  if (view === "summary") {
    return (
      <>
        <div className="stats">
          <Stat label="Overall Progress" value={`${overall}%`} />
          <Stat label="Components" value={components.length} />
          <Stat label="Approved" value={components.filter((c) => c.status === "Approved").length} />
          <Stat label="For Revision" value={components.filter((c) => c.status === "For Revision").length} />
          <Stat label="Open Issues" value={feedback.filter((f) => f.status === "Open").length} />
        </div>
        <Card title={project.title}>
          <p className="muted">{project.description}</p>
          <dl className="meta-grid">
            <div><dt>Type</dt><dd>{project.type}</dd></div>
            <div><dt>Adviser</dt><dd>{project.adviser}</dd></div>
            <div><dt>Started</dt><dd>{formatDate(project.startDate)}</dd></div>
            <div><dt>Progress</dt><dd><ProgressBar value={overall} /></dd></div>
          </dl>
        </Card>
      </>
    );
  }

  if (view === "activities") {
    return (
      <Card title="Latest activity" action={<Link to="/dashboard/history/timeline">View full timeline →</Link>}>
        {history.slice(0, 8).map((h) => <CommitRow key={h.id} entry={h} />)}
      </Card>
    );
  }

  if (view === "actions") {
    const items = [
      ...revisions
        .filter((r) => r.status === "For Revision")
        .map((r) => ({
          id: r.id,
          text: `Finish ${r.tasks.filter((t) => !t.done).length} revision task(s) for "${r.title}"`,
          to: "/dashboard/revisions/for-revision",
        })),
      ...revisions
        .filter((r) => r.status === "Pending")
        .map((r) => ({ id: r.id, text: `Submit "${r.title}"`, to: "/dashboard/revisions/pending" })),
      ...feedback
        .filter((f) => f.type === "clarification" && f.status === "Open")
        .map((f) => ({ id: f.id, text: `Clarification waiting: ${f.text}`, to: `/dashboard/feedback/details?id=${f.id}` })),
    ];
    return (
      <Card title={`${items.length} pending action(s)`}>
        {items.length === 0 && <Empty text="You're all caught up." />}
        {items.map((i) => (
          <Link key={i.id} to={i.to} className="list-row">
            <span>⚡ {i.text}</span><span>→</span>
          </Link>
        ))}
      </Card>
    );
  }

  if (view === "deadlines") {
    const upcoming = components.filter((c) => c.status !== "Approved").sort((a, b) => a.due.localeCompare(b.due));
    return (
      <Card title="Upcoming deadlines">
        <table className="table">
          <thead><tr><th>Component</th><th>Status</th><th>Due</th><th>Time left</th></tr></thead>
          <tbody>
            {upcoming.map((c) => {
              const d = daysUntil(c.due);
              return (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>{formatDate(c.due)}</td>
                  <td className={d < 0 ? "danger" : d <= 7 ? "warn" : ""}>
                    {d < 0 ? `${-d} day(s) overdue` : d === 0 ? "Due today" : `${d} day(s)`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    );
  }

  // progress
  return (
    <>
      <Card title="Overall progress">
        <div className="big-number">{overall}%</div>
        <ProgressBar value={overall} />
        <div className="chips">
          {STATUSES.map((s) => (
            <span key={s} className="chip-count">
              <StatusBadge status={s} /> {components.filter((c) => c.status === s).length}
            </span>
          ))}
        </div>
      </Card>
      <Card title="By component">
        {components.map((c) => (
          <div key={c.id} className="bar-row">
            <span>{c.name}</span>
            <ProgressBar value={c.progress} />
            <b>{c.progress}%</b>
          </div>
        ))}
      </Card>
    </>
  );
}