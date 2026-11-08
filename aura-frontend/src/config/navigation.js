// Sections marked `scope: "project"` only make sense once a project is selected.

const SYSTEM_GROUP = {
  group: "System",
  sections: [
    { id: "account", label: "Account", views: [] },
    {
      id: "notifications",
      label: "Notifications",
      views: [
        { id: "new-feedback", label: "New Feedback" },
        { id: "reminders", label: "Revision Reminders" },
        { id: "deadlines", label: "Upcoming Deadlines" },
        { id: "approvals", label: "Adviser Approval Updates" },
        { id: "team-activity", label: "Team Activity Updates" },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      views: [
        { id: "general", label: "General Preferences" },
        { id: "notifications", label: "Notification Preferences" },
        { id: "display", label: "Display Preferences" },
        { id: "privacy", label: "Privacy and Security" },
      ],
    },
    { id: "help", label: "Help & Guide", views: [] },
  ],
};

// Sidebar when no project is selected
export const MAIN_NAV = [
  {
    group: "Main",
    sections: [{ id: "overview", label: "Dashboard", path: "/dashboard/overview", views: [] }],
  },
  SYSTEM_GROUP,
];

// Sidebar once a project is selected
export const PROJECT_NAV = [
  {
    group: "Project Workspace",
    sections: [
      { id: "overview", label: "Dashboard", path: "/dashboard/overview", views: [] },
      {
        id: "components",
        label: "Components",
        scope: "project",
        views: [
          { id: "list", label: "Component List" },
          { id: "details", label: "Component Details" },
          { id: "status", label: "Component Status" },
          { id: "approval", label: "Adviser Approval Status" },
        ],
      },
      {
        id: "feedback",
        label: "Feedback & Issues",
        scope: "project",
        views: [
          { id: "all", label: "All Feedback" },
          { id: "add", label: "Add Feedback" },
          { id: "details", label: "Feedback Details" },
          { id: "clarifications", label: "Clarification Requests" },
          { id: "unresolved", label: "Unresolved Issues" },
        ],
      },
      {
        id: "revisions",
        label: "Revision Reviews",
        scope: "project",
        views: [
          { id: "pending", label: "Pending Revisions" },
          { id: "submitted", label: "Submitted Revisions" },
          { id: "under-review", label: "Under Review" },
          { id: "for-revision", label: "For Revision" },
          { id: "resubmitted", label: "Resubmitted" },
          { id: "approved", label: "Approved" },
        ],
      },
      {
        id: "files",
        label: "Files & Links",
        scope: "project",
        views: [
          { id: "uploaded", label: "Uploaded Files" },
          { id: "links", label: "Document Links" },
          { id: "references", label: "Reference Materials" },
          { id: "by-component", label: "Files by Component" },
        ],
      },
      {
        id: "history",
        label: "Revision History",
        scope: "project",
        views: [
          { id: "timeline", label: "Revision Timeline" },
          { id: "previous-feedback", label: "Previous Feedback" },
          { id: "changes", label: "Changes Made" },
          { id: "records", label: "Revision Records" },
        ],
      },
      {
        id: "team",
        label: "Team",
        scope: "project",
        views: [
          { id: "members", label: "Team Members" },
          { id: "tasks", label: "Assigned Tasks" },
          { id: "responsibilities", label: "Member Responsibilities" },
          { id: "progress", label: "Team Progress" },
        ],
      },
      { id: "project-settings", label: "Project Settings", scope: "project", views: [] },
    ],
  },
  SYSTEM_GROUP,
];

export const ALL_SECTIONS = [
  ...MAIN_NAV.flatMap((g) => g.sections),
  ...PROJECT_NAV.flatMap((g) => g.sections),
];

export const findSection = (id) => ALL_SECTIONS.find((s) => s.id === id);

/* ---------------------------------------------------------------------------
 * SIDEBAR LAYOUT
 * MAIN_NAV / PROJECT_NAV above are the ROUTE REGISTRY (every page + its views).
 * The lists below describe what the sidebar shows AND what the page header / tab row shows:
 *   label  -> sidebar text AND the page title
 *   desc   -> the one-line description under the page title
 *   tabs   -> which views of the section appear as tabs for THIS sidebar item
 *             (omit = every view of the section; a single tab is never shown)
 * Views that are left out of `tabs` still work as routes (e.g. details pages are
 * reached by clicking an item, "records" can be re-added by listing it).
 * ------------------------------------------------------------------------- */

// Sidebar when no project is open
export const GLOBAL_SIDEBAR = [
  {
    heading: "Global Navigation",
    items: [
      { label: "Home — My Projects", icon: "home", to: "/dashboard/overview", match: (s) => s === "overview" },
      {
        label: "Settings",
        icon: "settings",
        to: "/dashboard/settings/general",
        match: (s) => s === "settings",
        desc: "Manage how AURA looks and behaves for you.",
      },
      {
        label: "Account",
        icon: "user",
        to: "/dashboard/account/profile",
        match: (s) => s === "account",
        desc: "Your profile, password and account options.",
      },
      {
        label: "Help & Guide",
        icon: "help",
        to: "/dashboard/help",
        match: (s) => s === "help",
        desc: "Learn how to turn adviser feedback into clear revision tasks.",
      },
    ],
  },
];

// Sidebar once a project is open
export const PROJECT_SIDEBAR = [
  {
    heading: "Main",
    items: [{ label: "Dashboard", icon: "home", to: "/dashboard/overview", match: (s) => s === "overview" }],
  },
  {
    heading: "Project Management",
    items: [
      {
        label: "Project Sections",
        icon: "sections",
        to: "/dashboard/components/list",
        match: (s) => s === "components",
        desc: "Every chapter, diagram, prototype and presentation in this project.",
        tabs: ["list", "status", "approval"], // "details" opens from a row in the list
      },
      {
        label: "Files & Links",
        icon: "file",
        to: "/dashboard/files/uploaded",
        match: (s) => s === "files",
        desc: "Documents, links and reference materials for this project.",
      },
      {
        label: "Team Members",
        icon: "team",
        to: "/dashboard/team/members",
        match: (s, v) => s === "team" && v !== "tasks",
        desc: "Who is on the team and what each person is responsible for.",
        tabs: ["members", "responsibilities", "progress"],
      },
    ],
  },
  {
    heading: "Feedback & Revisions",
    items: [
      {
        label: "Feedback Journal",
        icon: "journal",
        to: "/dashboard/feedback/all",
        badge: "unresolvedFeedback",
        match: (s, v) => s === "feedback" && v !== "clarifications",
        desc: "Everything your adviser has said, and what is still open.",
        tabs: ["all", "unresolved", "add"], // "details" opens from a feedback item
      },
      {
        label: "Revision History",
        icon: "history",
        to: "/dashboard/history/timeline",
        match: (s) => s === "history",
        desc: "Every change made to the project, newest first.",
        tabs: ["timeline", "changes", "previous-feedback"],
      },
      {
        label: "Clarification Tracker",
        icon: "clarify",
        to: "/dashboard/feedback/clarifications",
        match: (s, v) => s === "feedback" && v === "clarifications",
        desc: "Questions you asked about unclear feedback.",
        tabs: [],
      },
      {
        label: "Next Actions",
        icon: "actions",
        to: "/dashboard/team/tasks",
        match: (s, v) => s === "team" && v === "tasks",
        desc: "Tasks created from feedback, who owns them and when they are due.",
        tabs: [],
      },
    ],
  },
  {
    heading: "Project Delivery",
    items: [
      {
        label: "Submissions",
        icon: "send",
        to: "/dashboard/revisions/pending",
        match: (s) => s === "revisions",
        desc: "Track each revision from pending to approved.",
      },
    ],
  },
  {
    heading: "Settings",
    items: [
      {
        label: "Project Settings",
        icon: "settings",
        to: "/dashboard/project-settings",
        match: (s) => s === "project-settings",
        desc: "Manage project details, deadline and status.",
      },
    ],
  },
];

// descriptions for pages that have no sidebar item (they are opened from the bell icon)
const EXTRA_DESC = {
  notifications: "Updates about feedback, deadlines, approvals and your team.",
};

/**
 * Everything the page header + tab row need, in one place.
 * Returns null when there is nothing to show (unknown page, or a project page with no project open).
 */
export function getPageMeta(sectionId, viewId, hasProject) {
  const section = findSection(sectionId);
  if (!section || (section.scope === "project" && !hasProject)) return null;

  const sidebar = hasProject ? PROJECT_SIDEBAR : GLOBAL_SIDEBAR;
  const item = sidebar.flatMap((g) => g.items).find((i) => i.match(sectionId, viewId));
  const view = section.views.find((v) => v.id === viewId);

  const tabIds = item?.tabs ?? section.views.map((v) => v.id);
  const tabs = tabIds.map((id) => section.views.find((v) => v.id === id)).filter(Boolean);

  const showTabs = tabs.length > 1;
  return {
    // one title per page: the sidebar name, so the header always matches the menu you clicked
    // (pages without a sidebar item, like Notifications, use their section name)
    title: item?.label ?? (showTabs ? section.label : view?.label ?? section.label),
    desc: item?.desc ?? EXTRA_DESC[sectionId] ?? "",
    tabs: showTabs ? tabs : [],
  };
}