import { useProject } from "../context/sharedProjectContext";

export const slug = (s = "") => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
// "2026-11-05" (date only) must be read as a local date, otherwise it can show as the previous day
const toDate = (iso) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso);
export const formatDate = (iso) =>
  iso ? toDate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
export const daysUntil = (iso) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((toDate(iso) - today) / 86400000);
};

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