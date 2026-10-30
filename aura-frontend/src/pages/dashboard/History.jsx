import { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { Card, CommitRow, Empty, StatusBadge, formatDate } from "../../components/ui";

export default function History({ view }) {
  const { data, compName } = useProject();
  const { history, feedback, components } = data;
  const [filter, setFilter] = useState("");

  if (view === "timeline") {
    const list = history.filter((h) => !filter || h.componentId === filter);
    const groups = list.reduce((acc, e) => {
      const k = formatDate(e.date);
      (acc[k] ||= []).push(e);
      return acc;
    }, {});
    return (
      <>
        <div className="toolbar">
          <label>Filter by component
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All components</option>
              {components.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        {Object.keys(groups).length === 0 && <Card><Empty /></Card>}
        {Object.entries(groups).map(([day, entries]) => (
          <div key={day} className="timeline-day">
            <h4>Commits on {day}</h4>
            <Card>{entries.map((e) => <CommitRow key={e.id} entry={e} />)}</Card>
          </div>
        ))}
      </>
    );
  }

  if (view === "previous-feedback") {
    const list = [...feedback].sort((a, b) => b.date.localeCompare(a.date));
    return (
      <Card>
        {list.length === 0 && <Empty />}
        {list.map((f) => (
          <div key={f.id} className="feedback-row">
            <div className="fb-top">
              <StatusBadge status={f.status} />
              <span className="chip">{compName(f.componentId)}</span>
            </div>
            <p>{f.text}</p>
            <small className="muted">{f.author} · {formatDate(f.date)}</small>
          </div>
        ))}
      </Card>
    );
  }

  if (view === "changes") {
    const list = history.filter((h) => h.changes.added || h.changes.removed);
    const max = Math.max(1, ...list.map((h) => h.changes.added + h.changes.removed));
    return (
      <Card>
        {list.length === 0 && <Empty />}
        {list.map((h) => (
          <div key={h.id} className="change-row">
            <div>
              <strong>{h.message}</strong>
              <small className="muted">{compName(h.componentId)} · {formatDate(h.date)} · <code>{h.hash}</code></small>
            </div>
            <div className="diffbar">
              <i className="add">+{h.changes.added}</i>
              <i className="del">−{h.changes.removed}</i>
              <span className="bars">
                <b className="g" style={{ width: `${(h.changes.added / max) * 100}%` }} />
                <b className="r" style={{ width: `${(h.changes.removed / max) * 100}%` }} />
              </span>
            </div>
          </div>
        ))}
      </Card>
    );
  }

  // records
  return (
    <Card>
      <table className="table">
        <thead><tr><th>Commit</th><th>Type</th><th>Message</th><th>Component</th><th>Author</th><th>Date</th></tr></thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id}>
              <td><code>{h.hash}</code></td>
              <td><span className={`type type-${h.type}`}>{h.type}</span></td>
              <td>{h.message}</td>
              <td>{compName(h.componentId)}</td>
              <td>{h.author}</td>
              <td>{formatDate(h.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}