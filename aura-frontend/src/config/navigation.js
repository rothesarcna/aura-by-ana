export const NAV = [
  {
    group: "Menu",
    sections: [
      { id: "overview", icon: "📊", label: "Overview", views: [
        { id: "summary", label: "Project Summary" },
        { id: "activities", label: "Recent Activities" },
        { id: "actions", label: "Pending Actions" },
        { id: "deadlines", label: "Upcoming Deadlines" },
        { id: "progress", label: "Progress Summary" },
      ]},
      { id: "components", icon: "📁", label: "Components", views: [
        { id: "list", label: "Component List" },
        { id: "details", label: "Component Details" },
        { id: "status", label: "Component Status" },
        { id: "approval", label: "Adviser Approval Status" },
      ]},
      { id: "feedback", icon: "💬", label: "Feedback & Issues", views: [
        { id: "all", label: "All Feedback" },
        { id: "add", label: "Add Feedback" },
        { id: "details", label: "Feedback Details" },
        { id: "clarifications", label: "Clarification Requests" },
        { id: "unresolved", label: "Unresolved Issues" },
      ]},
      { id: "revisions", icon: "🔄", label: "Revision Reviews", views: [
        { id: "pending", label: "Pending Revisions" },
        { id: "submitted", label: "Submitted Revisions" },
        { id: "under-review", label: "Under Review" },
        { id: "for-revision", label: "For Revision" },
        { id: "resubmitted", label: "Resubmitted" },
        { id: "approved", label: "Approved" },
      ]},
      { id: "files", icon: "📎", label: "Files & Links", views: [
        { id: "uploaded", label: "Uploaded Files" },
        { id: "links", label: "Document Links" },
        { id: "references", label: "Reference Materials" },
        { id: "by-component", label: "Files by Component" },
      ]},
      { id: "history", icon: "📜", label: "Revision History", views: [
        { id: "timeline", label: "Revision Timeline" },
        { id: "previous-feedback", label: "Previous Feedback" },
        { id: "changes", label: "Changes Made" },
        { id: "records", label: "Revision Records" },
      ]},
      { id: "team", icon: "👥", label: "Team", views: [
        { id: "members", label: "Team Members" },
        { id: "tasks", label: "Assigned Tasks" },
        { id: "responsibilities", label: "Member Responsibilities" },
        { id: "progress", label: "Team Progress" },
      ]},
    ],
  },
  {
    group: "Account",
    sections: [
      { id: "account", icon: "👤", label: "User Account", views: [
        { id: "profile", label: "Profile Information" },
        { id: "name-email", label: "Name and Email" },
        { id: "password", label: "Change Password" },
        { id: "role", label: "Account Role" },
      ]},
      { id: "notifications", icon: "🔔", label: "Notifications", views: [
        { id: "new-feedback", label: "New Feedback" },
        { id: "reminders", label: "Revision Reminders" },
        { id: "deadlines", label: "Upcoming Deadlines" },
        { id: "approvals", label: "Adviser Approval Updates" },
        { id: "team-activity", label: "Team Activity Updates" },
      ]},
      { id: "settings", icon: "⚙️", label: "Settings", views: [
        { id: "general", label: "General Preferences" },
        { id: "notifications", label: "Notification Preferences" },
        { id: "display", label: "Display Preferences" },
        { id: "privacy", label: "Privacy and Security" },
      ]},
      { id: "help", icon: "❓", label: "Help & Guide", views: [
        { id: "getting-started", label: "Getting Started" },
        { id: "manage-projects", label: "How to Manage Projects" },
        { id: "record-feedback", label: "How to Record Feedback" },
        { id: "manage-revisions", label: "How to Manage Revisions" },
        { id: "request-clarification", label: "How to Request Clarification" },
        { id: "statuses", label: "Understanding Revision Statuses" },
        { id: "approval-workflow", label: "Adviser Approval Workflow" },
        { id: "faq", label: "Frequently Asked Questions" },
        { id: "contact", label: "Contact Support" },
      ]},
    ],
  },
];

export const ALL_SECTIONS = NAV.flatMap((g) => g.sections);
export const findSection = (id) => ALL_SECTIONS.find((s) => s.id === id);