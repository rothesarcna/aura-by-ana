import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProject } from "../../context/ProjectContext";
import { STATUSES } from "../../data/mockData";
import ComponentForm from "./ComponentForm";
import { Card, Empty, ProgressBar, StatusBadge, formatDate } from "../ui";

export default function Components({ view }) {
  const { data = {}, actions = {} } = useProject();
  const {
    components = [],
    files = [],
    feedback = [],
    revisions = [],
    members = [],
    project = {},
    tasks = [],
  } = data;
  const [params, setParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const owner = (id) => (members || []).find((m) => m.id === id)?.name ?? "—";

  if (view === "list") {
    return (
      <>
        {formOpen ? (
          <ComponentForm
            key={editing?.id || "new"}
            initial={editing}
            members={members}
            onCancel={closeForm}
            onSave={(values) => {
              if (editing) actions.updateComponent(editing.id, values);
              else actions.addComponent(values);
              closeForm();
            }}
          />
        ) : (
          <div className="toolbar">
            <button className="btn" onClick={() => setFormOpen(true)}>
              + Add component
            </button>
          </div>
        )}

        <Card>
          {components.length === 0 ? (
            <Empty text="No components yet. Add your first chapter, diagram, prototype or presentation." />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Due</th>
                  <th>Owner</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {components.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ minWidth: 120 }}>
                      <ProgressBar value={c.progress || 0} />
                    </td>
                    <td>{formatDate(c.due)}</td>
                    <td>{owner(c.owner)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <Link to={`/dashboard/components/details?id=${c.id}`}>Details</Link>{" "}
                      <button
                        className="btn ghost small"
                        onClick={() => {
                          setEditing(c);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </button>{" "}
                      <button
                        className="btn ghost small danger"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete "${c.name}"? Its revisions, feedback and tasks will be removed too (history is kept).`
                            )
                          ) {
                            actions.deleteComponent(c.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </>
    );
  }

  if (view === "details") {
    const c = components.find((x) => x.id === params.get("id")) || components[0];

    if (!c) {
      return (
        <Card>
          <Empty text="No component details available." />
        </Card>
      );
    }

    const connectedFiles = (files || []).filter((f) => f.componentId === c.id);
    const connectedFeedback = (feedback || []).filter((f) => f.componentId === c.id);
    const connectedRevisions = (revisions || []).filter((r) => r.componentId === c.id);

    return (
      <>
        <div className="toolbar">
          <label>
            Component
            <select value={c.id} onChange={(e) => setParams({ id: e.target.value })}>
              {components.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Card title={c.name}>
          {c.description && <p className="muted">{c.description}</p>}
          <dl className="meta-grid">
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={c.status} />
              </dd>
            </div>
            <div>
              <dt>Adviser approval</dt>
              <dd>
                <StatusBadge status={c.approval || "Not Requested"} />
              </dd>
            </div>
            <div>
              <dt>Due</dt>
              <dd>{formatDate(c.due)}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{owner(c.owner)}</dd>
            </div>
            <div>
              <dt>Progress</dt>
              <dd>
                <ProgressBar value={c.progress || 0} />
              </dd>
            </div>
          </dl>
        </Card>
        <div className="grid-2">
          <Card title="Connected files & links">
            {connectedFiles.map((f) => (
              <div key={f.id} className="list-row">
                <span>{f.name}</span>
              </div>
            ))}
            {connectedFiles.length === 0 && <Empty text="No files connected yet." />}
          </Card>
          <Card title="Feedback">
            {connectedFeedback.map((f) => (
              <Link key={f.id} to={`/dashboard/feedback/details?id=${f.id}`} className="list-row">
                <span>{(f.text || "").slice(0, 70)}…</span>
                <StatusBadge status={f.status} />
              </Link>
            ))}
            {connectedFeedback.length === 0 && <Empty text="No feedback yet." />}
          </Card>
        </div>
        <div className="grid-2">
          <Card title="Revisions">
            {connectedRevisions.map((r) => (
              <div key={r.id} className="list-row">
                <span>{r.title}</span>
                <StatusBadge status={r.status} />
              </div>
            ))}
            {connectedRevisions.length === 0 && <Empty text="No revisions yet." />}
          </Card>
          <Card title="Next actions">
            {tasks
              .filter((t) => t.componentId === c.id)
              .map((t) => (
                <div key={t.id} className="list-row">
                  <span>{t.title}</span>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            {tasks.filter((t) => t.componentId === c.id).length === 0 && <Empty text="No actions yet." />}
          </Card>
        </div>
      </>
    );
  }

  if (view === "status") {
    const statusList = STATUSES;
    return (
      <div className="board">
        {statusList.map((s) => {
          const list = components.filter((c) => c.status === s);
          return (
            <div key={s} className="column">
              <div className="column-head">
                <StatusBadge status={s} />
                <b>{list.length}</b>
              </div>
              {list.map((c) => (
                <Link key={c.id} to={`/dashboard/components/details?id=${c.id}`} className="kcard">
                  <strong>{c.name}</strong>
                  <small>Due {formatDate(c.due)}</small>
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  // Approval view
  return (
    <Card>
      <p className="muted">
        Your adviser does not need an account. Request approval, then record their decision here once you hear back.
      </p>
      {components.length === 0 ? (
        <Empty text="No components to approve." />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Adviser</th>
              <th>Approval</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {components.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{project?.adviser || "—"}</td>
                <td>
                  <StatusBadge status={c.approval || "Not Requested"} />
                </td>
                <td>
                  {(c.approval === "Not Requested" || c.approval === "Rejected" || !c.approval) && (
                    <button className="btn small" onClick={() => actions.requestApproval(c.id)}>
                      Request approval
                    </button>
                  )}
                  {c.approval === "Pending" && (
                    <span className="btn-row" style={{ margin: 0 }}>
                      <button className="btn small" onClick={() => actions.setApproval(c.id, "Approved")}>
                        Mark approved
                      </button>
                      <button className="btn ghost small danger" onClick={() => actions.setApproval(c.id, "Rejected")}>
                        Mark rejected
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}