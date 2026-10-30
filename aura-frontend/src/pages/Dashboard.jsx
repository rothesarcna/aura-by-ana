import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { NAV, findSection } from "../config/navigation";
import { ProjectProvider, useProject } from "../context/ProjectContext";
import { logout } from "../services/authService";
import "./Dashboard.css";

function Shell() {
  const { user, data, settings } = useProject();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState({});

  const [, , sectionId, viewId] = pathname.split("/");
  const section = findSection(sectionId);
  const view = section?.views.find((v) => v.id === viewId);

  const isOpen = (id) => open[id] ?? id === sectionId;
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !isOpen(id) }));

  useEffect(() => setMenuOpen(false), [pathname]);

  const unread = data.notifications.filter((n) => !n.read && settings.notify[n.category] !== false).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={`dash ${settings.compact ? "compact" : ""}`} data-theme={settings.theme}>
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <span>AURA</span>
          <small>Know What to Do Next.</small>
        </div>

        <nav>
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="nav-group">{g.group}</div>
              {g.sections.map((s) => (
                <div key={s.id} className="nav-section">
                  <button
                    className={`nav-head ${sectionId === s.id ? "active" : ""}`}
                    onClick={() => toggle(s.id)}
                    aria-expanded={isOpen(s.id)}
                  >
                    <span>{s.icon} {s.label}</span>
                    <span className={`caret ${isOpen(s.id) ? "down" : ""}`}>›</span>
                  </button>
                  {isOpen(s.id) && (
                    <ul>
                      {s.views.map((v) => (
                        <li key={v.id}>
                          <NavLink
                            to={`/dashboard/${s.id}/${v.id}`}
                            className={({ isActive }) => (isActive ? "active" : "")}
                          >
                            {v.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">☰</button>
          <div className="crumbs">
            <span>{section?.label}</span>
            {view && <> / <b>{view.label}</b></>}
          </div>
          <div className="topbar-right">
            <Link className="bell" to="/dashboard/notifications/new-feedback" aria-label="Notifications">
              🔔{unread > 0 && <em>{unread}</em>}
            </Link>
            <Link to="/dashboard/account/profile" className="user">
              <span className="avatar">{user?.fullName?.[0]?.toUpperCase() ?? "?"}</span>
              <span className="user-name">{user?.fullName}</span>
            </Link>
            <button className="btn ghost" onClick={handleLogout}>Log out</button>
          </div>
        </header>

        <main className="content">
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