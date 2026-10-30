import { Link, useSearchParams } from "react-router-dom";
import { useProject } from "../../context/ProjectContext";
import { STATUSES } from "../../data/mockData";
import { Card, Empty, ProgressBar, StatusBadge, formatDate } from "../../components/ui";

export default function Components({ view }) {
  const { data, actions, compName } = useProject();
  const { components, files, feedback, revisions, members, project } = data;
  const [params, setParams] = useSearchParams();
  const owner = (id) => members.find((m) => m.id === id)?.name ?? "—";

  if (view === "list") {
    return (
      <Card>
        <table className="table">
          <thead><tr><th>Component</th><th>Status</th><th>Progress</th><th>Due</th><th>Owner</th><th /></tr></thead>
          <tbody>
            {components.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td><StatusBadge status={c.status} /></td>
                <td style={{ minWidth: 120 }}><ProgressBar value={c.progress} /></td>
                <td>{formatDate(c.due)}</td>
                <td>{owner(c.owner)}</td>
                <td><Link to={`/dashboard/components/details?id=${c.id}`}>Details</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    );
  }

  if (view === "details") {
    const c = components.find((x) => x.id === params.get("id")) || components[0];
    return (
      <>
        <div className="toolbar">
          <label>Component
            <select value={c.id} onChange={(e) => setParams({ id: e.target.value })}>
              {components.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
        </div>
        <Card title={c.name}>
          <p className="muted">{c.description}</p>
          <dl className="meta-grid">
            <div><dt>Status</dt><dd><StatusBadge status={c.status} /></dd></div>
            <div><dt>Adviser approval</dt><dd><StatusBadge status={c.approval} /></dd></div>
            <div><dt>Due</dt><dd>{formatDate(c.due)}</dd></div>
            <div><dt>Owner</dt><dd>{owner(c.owner)}</dd></div>
            <div><dt>Progress</dt><dd><ProgressBar value={c.progress} /></dd></div>
          </dl>
        </Card>
        <div className="grid-2">
          <Card title="Connected files & links">
            {files.filter((f) => f.componentId === c.id).map((f) => <div key={f.id} className="list-row"><span>{f.name}</span></div>)}
            {!files.some((f) => f.componentId === c.id) && <Empty text="No files connected yet." />}
          </Card>
          <Card title="Feedback">
            {feedback.filter((f) => f.componentId === c.id).map((f) => (
              <Link key={f.id} to={`/dashboard/feedback/details?id=${f.id}`} className="list-row">
                <span>{f.text.slice(0, 70)}…</span><StatusBadge status={f.status} />
              </Link>
            ))}
            {!feedback.some((f) => f.componentId === c.id) && <Empty text="No feedback yet." />}
          </Card>
        </div>
        <Card title="Revisions">
          {revisions.filter((r) => r.componentId === c.id).map((r) => (
            <div key={r.id} className="list-row"><span>{r.title}</span><StatusBadge status={r.status} /></div>
          ))}
          {!revisions.some((r) => r.componentId === c.id) && <Empty text="No revisions yet." />}
        </Card>
      </>
    );
  }

  if (view === "status") {
    return (
      <div className="board">
        {STATUSES.map((s) => (
          <div key={s} className="column">
            <div className="column-head"><StatusBadge status={s} /> <b>{components.filter((c) => c.status === s).length}</b></div>
            {components.filter((c) => c.status === s).map((c) => (
              <Link key={c.id} to={`/dashboard/components/details?id=${c.id}`} className="kcard">
                <strong>{c.name}</strong>
                <small>Due {formatDate(c.due)}</small>
              </Link>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // approval
  return (
    <Card>
      <table className="table">
        <thead><tr><th>Component</th><th>Adviser</th><th>Approval</th><th /></tr></thead>
        <tbody>
          {components.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{project.adviser}</td>
              <td><StatusBadge status={c.approval} /></td>
              <td>
                {(c.approval === "Not Requested" || c.approval === "Rejected") && (
                  <button className="btn small" onClick={() => actions.requestApproval(c.id)}>Request approval</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}