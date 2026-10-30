import { useProject } from "../../context/ProjectContext";
import { Card, Empty, formatDate } from "../../components/ui";

const CATEGORY = {
  "new-feedback": "feedback",
  reminders: "reminder",
  deadlines: "deadline",
  approvals: "approval",
  "team-activity": "team",
};
const ICON = { feedback: "💬", reminder: "⏰", deadline: "📅", approval: "✅", team: "👥" };

export default function Notifications({ view }) {
  const { data, settings, actions } = useProject();
  const cat = CATEGORY[view];
  const items = data.notifications.filter((n) => n.category === cat).sort((a, b) => b.date.localeCompare(a.date));

  if (settings.notify[cat] === false) {
    return <Card><Empty text="This notification type is turned off in Settings → Notification Preferences." /></Card>;
  }

  return (
    <Card
      title={`${items.filter((n) => !n.read).length} unread`}
      action={<button className="btn ghost small" onClick={() => actions.markAllRead(cat)}>Mark all as read</button>}
    >
      {items.length === 0 && <Empty text="No notifications." />}
      {items.map((n) => (
        <button key={n.id} className={`notif ${n.read ? "" : "unread"}`} onClick={() => actions.markRead(n.id)}>
          <span>{ICON[n.category]}</span>
          <span className="notif-text">{n.text}<small className="muted">{formatDate(n.date)}</small></span>
          {!n.read && <i className="dot" />}
        </button>
      ))}
    </Card>
  );
}