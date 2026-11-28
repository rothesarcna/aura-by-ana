import { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { Card, CommitRow, Empty, StatusBadge, formatDate } from "../../components/ui";
import { projectApi } from "../../services/projectApi";

export default function History({ view }) {
  const { data, compName, remote } = useProject();
  const { history, feedbackHistory, components } = data;
  const [filter, setFilter] = useState("");
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState("");

  const makeReport = async () => {
    setReportError("");

    try {
      setReport(await projectApi.generateReport(data.project.id));
    } catch {
      setReportError("Could not generate the report.");
    }
  };

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
    const list = [...feedbackHistory].sort((a, b) => b.date.localeCompare(a.date));
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
    const list = history.filter(
      (h) => h.type === "revision" || h.changes.added || h.changes.removed
    );
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
            {(h.changes.added || h.changes.removed) ? (
              <div className="diffbar">
                <i className="add">+{h.changes.added}</i>
                <i className="del">−{h.changes.removed}</i>
                <span className="bars">
                  <b className="g" style={{ width: `${(h.changes.added / max) * 100}%` }} />
                  <b className="r" style={{ width: `${(h.changes.removed / max) * 100}%` }} />
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </Card>
    );
  }

  // records
return (
  <>
    {remote && (
      <div className="toolbar">
        <button className="btn" onClick={makeReport}>Generate report</button>
        {report && <button className="btn ghost" onClick={() => window.print()}>Print / save as PDF</button>}
        {reportError && <span className="muted">{reportError}</span>}
      </div>
    )}
    {report && (
      <Card title="Revision history report">
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{report.data}</pre>
      </Card>
    )}
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
  </>
  );
}
