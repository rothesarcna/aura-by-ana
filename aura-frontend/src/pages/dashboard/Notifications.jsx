import { useProject } from "../../context/ProjectContext";
import { Card, Empty, formatDate } from "../../components/ui";

const CATEGORY = {
  "new-feedback": "feedback",
  reminders: "reminder",
  deadlines: "deadline",
  approvals: "approval",
  "team-activity": "team",
};

const ICON = { 
  feedback: "💬", 
  reminder: "⏰", 
  deadline: "📅", 
  approval: "✅", 
  team: "👥" 
};

export default function Notifications({ view }) {
  const { data = {}, settings = {}, actions = {} } = useProject();
  const cat = CATEGORY[view] || "feedback";

  // Safe fallback if notifications or settings are missing/uninitialized
  const notificationsList = data?.notifications || [];
  const items = notificationsList
    .filter((n) => n?.category === cat)
    .sort((a, b) => (b?.date || "").localeCompare(a?.date || ""));

  if (settings?.notify?.[cat] === false) {
    return (
      <Card>
        <Empty text="This notification type is turned off in Settings → Notification Preferences." />
      </Card>
    );
  }

  const unreadCount = items.filter((n) => !n?.read).length;

  return (
    <Card
      title={`${unreadCount} unread`}
      action={
        <button className="btn ghost small" onClick={() => actions?.markAllRead?.(cat)}>
          Mark all as read
        </button>
      }
    >
      {items.length === 0 && <Empty text="No notifications." />}
      {items.map((n) => (
        <button
          key={n.id}
          className={`notif ${n.read ? "" : "unread"}`}
          onClick={() => actions?.markRead?.(n.id)}
        >
          <span>{ICON[n.category] || "🔔"}</span>
          <span className="notif-text">
            {n.text}
            <small className="muted">
              {n.projectTitle ? `${n.projectTitle} · ` : ""}
              {n.date ? formatDate(n.date) : ""}
            </small>
          </span>
          {!n.read && <i className="dot" />}
        </button>
      ))}
    </Card>
  );
}