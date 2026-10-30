import { useProject } from "../context/ProjectContext";

export const slug = (s = "") => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
export const daysUntil = (iso) => Math.ceil((new Date(iso) - new Date()) / 86400000);

export function StatusBadge({ status }) {
  return <span className={`badge badge-${slug(status)}`}>{status}</span>;
}

export function Card({ title, action, children }) {
  return (
    <section className="card">
      {(title || action) && (
        <div className="card-head">
          <h3>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ProgressBar({ value }) {
  return (
    <div className="progress" title={`${value}%`}>
      <div style={{ width: `${value}%` }} />
    </div>
  );
}

export function Empty({ text = "Nothing here yet." }) {
  return <div className="empty">{text}</div>;
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

// One GitHub-style commit line
export function CommitRow({ entry }) {
  const { compName } = useProject();
  const { added, removed } = entry.changes;
  return (
    <div className="commit">
      <span className={`commit-dot ${entry.type}`} />
      <div className="commit-body">
        <div className="commit-msg">{entry.message}</div>
        <div className="commit-meta">
          <b>{entry.author}</b> committed on {formatDate(entry.date)}
          <span className="chip">{compName(entry.componentId)}</span>
          {(added > 0 || removed > 0) && (
            <span className="diff">
              <i className="add">+{added}</i> <i className="del">−{removed}</i>
            </span>
          )}
        </div>
      </div>
      <code className="hash">{entry.hash}</code>
    </div>
  );
}