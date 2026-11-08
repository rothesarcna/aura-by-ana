import { Link, useNavigate } from "react-router-dom";
import { useProject } from "../../context/ProjectContext";
import { Card, Toggle } from "../../components/ui";
import { logout } from "../../services/authService";

const LANDING_OPTIONS = [
  ["/dashboard/overview", "Dashboard (my projects)"],
  ["/dashboard/notifications/new-feedback", "Notifications"],
  ["/dashboard/help/getting-started", "Help & Guide"],
];

const NOTIFY_OPTIONS = [
  ["feedback", "New feedback", "When feedback or a clarification request is recorded."],
  ["reminder", "Revision reminders", "Reminders about unfinished revision tasks."],
  ["deadline", "Upcoming deadlines", "Alerts before a component is due."],
  ["approval", "Adviser approval updates", "When approval is requested, approved, or rejected."],
  ["team", "Team activity", "Uploads, assignments, and status changes by teammates."],
];

export default function Settings({ view }) {
  const { settings, setSettings, actions, user, remote } = useProject();
  const navigate = useNavigate();

  if (view === "notifications") {
    return (
      <Card>
        <p className="muted">Turned-off types are hidden from the bell counter and the Notifications pages.</p>
        {NOTIFY_OPTIONS.map(([key, label, hint]) => (
          <Toggle
            key={key}
            label={label}
            hint={hint}
            checked={settings.notify?.[key] !== false}
            onChange={(v) => setSettings((s) => ({ ...s, notify: { ...s.notify, [key]: v } }))}
          />
        ))}
      </Card>
    );
  }

  if (view === "display") {
    return (
      <Card>
        <div className="form">
          <label>
            Theme
            <select value={settings.theme} onChange={(e) => setSettings({ theme: e.target.value })}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
        <Toggle
          label="Compact layout"
          hint="Smaller spacing and text so more fits on screen."
          checked={!!settings.compact}
          onChange={(v) => setSettings({ compact: v })}
        />
      </Card>
    );
  }

  if (view === "privacy") {
    return (
      <>
        <Card title="Privacy">
          <Toggle
            label="Show my activity to teammates"
            hint="Teammates can see your uploads and status changes."
            checked={settings.privacy?.showActivity !== false}
            onChange={(v) => setSettings((s) => ({ ...s, privacy: { ...s.privacy, showActivity: v } }))}
          />
          <Toggle
            label="Show my email to teammates"
            hint="Off by default."
            checked={!!settings.privacy?.showEmail}
            onChange={(v) => setSettings((s) => ({ ...s, privacy: { ...s.privacy, showEmail: v } }))}
          />
        </Card>
        <Card title="Security">
          <p className="muted">
            Signed in as <b>{user?.email || user?.fullName}</b>. Change your password from{" "}
            <Link to="/dashboard/account/profile">Account</Link>.
          </p>
          <div className="btn-row">
            <button
              className="btn ghost"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Sign out on this device
            </button>
          </div>
        </Card>
      </>
    );
  }

  // general
  return (
    <>
      <Card>
        <div className="form">
          <label>
            Open this page after logging in
            <select value={settings.landing} onChange={(e) => setSettings({ landing: e.target.value })}>
              {LANDING_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>
      <Card title={remote ? "Browser data" : "Sample data"}>
        <p className="muted">
          {remote
            ? "Your projects, feedback and tasks are saved on the AURA server. Reset only clears what is kept in this browser: notifications, saved files and links, member responsibilities and your preferences."
            : "Your projects, feedback and tasks are saved in this browser. Reset restores the original sample projects and removes everything you added."}
        </p>
        <div className="btn-row">
          <button
            className="btn danger"
            onClick={() => {
              if (window.confirm(remote ? "Clear notifications, saved files and preferences stored in this browser? Your projects on the server are not affected." : "Reset all projects and data to the sample data? This cannot be undone.")) {
                actions.resetData();
              }
            }}
          >
            {remote ? "Clear browser data" : "Reset to sample data"}
          </button>
        </div>
      </Card>
    </>
  );
}