import { useProject } from "../../context/ProjectContext";
import { Card, ProgressBar, StatusBadge, formatDate } from "../../components/ui";

export default function Team({ view }) {
  const { data, actions, compName } = useProject();
  const { members, tasks } = data;
  const name = (id) => members.find((m) => m.id === id)?.name ?? "—";

  if (view === "members") {
    return (
      <div className="grid-3">
        {members.map((m) => (
          <Card key={m.id}>
            <div className="member">
              <span className="avatar big">{m.name[0]}</span>
              <div>
                <strong>{m.name}</strong>
                <div className="muted">{m.role}</div>
                <small>{m.email}</small>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (view === "tasks") {
    return (
      <Card>
        <table className="table">
          <thead><tr><th>Task</th><th>Assigned to</th><th>Component</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>{name(t.assignee)}</td>
                <td>{compName(t.componentId)}</td>
                <td>{formatDate(t.due)}</td>
                <td>
                  <select value={t.status} onChange={(e) => actions.setTaskStatus(t.id, e.target.value)}>
                    <option>To Do</option><option>In Progress</option><option>Done</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    );
  }

  if (view === "responsibilities") {
    return (
      <div className="grid-3">
        {members.map((m) => (
          <Card key={m.id} title={m.name}>
            <div className="muted">{m.role}</div>
            <ul className="bullets">{m.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul>
          </Card>
        ))}
      </div>
    );
  }

  // progress
  const done = tasks.filter((t) => t.status === "Done").length;
  const overall = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return (
    <>
      <Card title="Team progress">
        <div className="big-number">{overall}%</div>
        <ProgressBar value={overall} />
        <small className="muted">{done} of {tasks.length} tasks done</small>
      </Card>
      <Card title="By member">
        {members.map((m) => {
          const mine = tasks.filter((t) => t.assignee === m.id);
          const d = mine.filter((t) => t.status === "Done").length;
          const pct = mine.length ? Math.round((d / mine.length) * 100) : 0;
          return (
            <div key={m.id} className="bar-row">
              <span>{m.name}</span>
              <ProgressBar value={pct} />
              <b>{d}/{mine.length}</b>
            </div>
          );
        })}
      </Card>
    </>
  );
}