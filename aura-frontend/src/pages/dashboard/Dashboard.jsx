import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { GLOBAL_SIDEBAR, PROJECT_SIDEBAR, findSection } from "../../config/navigation";
import { ProjectProvider, useProject } from "../../context/ProjectContext";
import { logout } from "../../services/authService";
import { StatusBadge, formatDate } from "../../components/ui";
import Icon from "../../components/Icons";
import auraLogo from "../../assets/aura_v2.png";
import "./Dashboard.css";

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

function Shell() {
  const { user, data, settings, selectedProject, setSelectedProject, projectProgress, error, clearError, remote, actions } =
    useProject();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const [, , sectionId, viewId] = pathname.split("/");
  const section = findSection(sectionId);

  // close the mobile sidebar + user menu whenever the page changes
  useEffect(() => {
    setMenuOpen(false);
    setUserMenu(false);
  }, [pathname]);

  // close the user menu when clicking anywhere else or pressing Escape
  useEffect(() => {
    if (!userMenu) return undefined;
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenu(false);
    };
    const onKey = (e) => e.key === "Escape" && setUserMenu(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenu]);

  const unread = data?.notifications
    ? data.notifications.filter((n) => !n.read && settings?.notify?.[n.category] !== false).length
    : 0;

  const unresolvedFeedback = (data?.feedback || []).filter(
    (f) => f.status !== "Resolved" && f.status !== "Closed"
  ).length;
  const badges = { unresolvedFeedback };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const leaveProject = () => {
    setSelectedProject(null);
    navigate("/dashboard/overview");
  };

  const sidebar = selectedProject ? PROJECT_SIDEBAR : GLOBAL_SIDEBAR;

  // Sub-tabs of the current page (hidden when a project page is opened without a project)
  const subTabs =
    section?.views?.length && !(section.scope === "project" && !selectedProject) ? section.views : null;

  const progress = selectedProject ? projectProgress(selectedProject) : 0;

  return (
    <div className={`dash ${settings?.compact ? "compact" : ""}`} data-theme={settings?.theme}>
      <header className="topbar">
        <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          ☰
        </button>

        {selectedProject ? (
          <div className="topbar-project">
            <button type="button" className="btn ghost back-pill" onClick={leaveProject}>
              <Icon name="back" size={16} />
              <span>My Projects</span>
            </button>
            <span className="topbar-divider" aria-hidden="true" />
            <span className="project-mark" aria-hidden="true">
              <Icon name="chart" size={20} />
            </span>
            <div className="topbar-project-text">
              <div className="topbar-project-title">
                <h1 title={selectedProject.title}>{selectedProject.title}</h1>
                <StatusBadge status={selectedProject.status} />
              </div>
              <small>
                Deadline: {selectedProject.deadline ? formatDate(selectedProject.deadline) : "Not set"}
                <span className="dot-sep" aria-hidden="true">•</span>
                Progress: {progress}%
              </small>
            </div>
          </div>
        ) : (
          <Link to="/dashboard/overview" className="brand" aria-label="AURA home">
            <span className="brand-mark" aria-hidden="true">
              <img
                src={auraLogo}
                alt="AURA Logo"
                style={{ height: "32px", objectFit: "contain" }}
              />
            </span>
            <span className="brand-text">
              <h3>Keep Track of Feedback. Know What to Do Next.</h3>
            </span>
          </Link>
        )}

        <div className="topbar-right">
          {selectedProject && (
            <Link
              className="icon-link"
              to="/dashboard/project-settings"
              aria-label="Project settings"
              title="Project settings"
            >
              <Icon name="settings" size={20} />
            </Link>
          )}
          <Link className="icon-link bell" to="/dashboard/notifications/new-feedback" aria-label="Notifications">
            <Icon name="bell" size={20} />
            {unread > 0 && <em>{unread}</em>}
          </Link>

          <span className="topbar-divider tall" aria-hidden="true" />

          <div className="user-menu" ref={userMenuRef}>
            <button
              type="button"
              className="user"
              onClick={() => setUserMenu((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={userMenu}
              aria-label="Account menu"
            >
              <span className="avatar">{initials(user?.fullName)}</span>
              <span className="user-info">
                <span className="user-name">{user?.fullName}</span>
                {user?.course && <small>{user.course}</small>}
              </span>
              <Icon name="chevron" size={16} className="user-caret" />
            </button>

            {userMenu && (
              <div className="menu user-dropdown" role="menu">
                <Link role="menuitem" to="/dashboard/account/profile">
                  <Icon name="user" size={16} /> Account
                </Link>
                <Link role="menuitem" to="/dashboard/settings/general">
                  <Icon name="settings" size={16} /> Settings
                </Link>
                <Link role="menuitem" to="/dashboard/help">
                  <Icon name="help" size={16} /> Help &amp; Guide
                </Link>
                <button role="menuitem" type="button" className="danger" onClick={handleLogout}>
                  <Icon name="logout" size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dash-body">
        <aside className={`sidebar ${menuOpen ? "open" : ""}`} aria-label="Navigation">
          <nav>
            {sidebar.map((group) => (
              <div key={group.heading} className="nav-block">
                <div className="nav-group">{group.heading}</div>
                {group.items.map((item) => {
                  const active = item.match(sectionId, viewId);
                  const count = item.badge ? badges[item.badge] : 0;
                  return (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      className={`nav-head ${active ? "active" : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon name={item.icon} size={20} />
                      <span className="nav-label">{item.label}</span>
                      {count > 0 && <span className="nav-badge">{count}</span>}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

        <main className="content">
          {error && (
            <div
              className="alert error"
              role="alert"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}
            >
              <span>{error}</span>
              <span className="btn-row" style={{ margin: 0 }}>
                {remote && (
                  <button className="btn ghost small" onClick={() => actions.reload()}>
                    Retry
                  </button>
                )}
                <button className="btn ghost small" onClick={clearError}>
                  Dismiss
                </button>
              </span>
            </div>
          )}
          {subTabs && (
            <nav className="subtabs" aria-label={`${section.label} pages`}>
              {subTabs.map((v) => (
                <Link
                  key={v.id}
                  to={`/dashboard/${section.id}/${v.id}`}
                  className={`subtab ${v.id === viewId ? "active" : ""}`}
                >
                  {v.label}
                </Link>
              ))}
            </nav>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProjectProvider>
      <Shell />
    </ProjectProvider>
  );
}