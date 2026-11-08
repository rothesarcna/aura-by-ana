import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProject } from "../../context/ProjectContext";
import Icon from "../../components/Icons";
import { STATUSES } from "../../data/mockData";
import {
  CommitRow,
  Empty,
  ProgressBar,
  StatusBadge,
  daysUntil,
  formatDate,
} from "../../components/ui";

/*
 * Overview.jsx = two screens in one file:
 *   1. HOME       (no project selected)  -> welcome banner, search/filter toolbar, project cards
 *   2. DASHBOARD  (a project is selected) -> banner, 6 stat tiles, components progress,
 *                                            upcoming deadlines, next actions, recent activity
 *
 * ONLY the layout (JSX + class names) lives here. All data and actions still come from
 * useProject(), so both the localStorage provider and the Spring Boot provider keep working.
 * The matching styles are in dashboard-additions.css (append to Dashboard.css).
 */

export default function Overview() {
  const {
    data = {},
    user,
    selectedProject,
    setSelectedProject,
    projects: projectsList,
    projectProgress,
    actions,
  } = useProject();

  // Local state for search and filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // Options dropdown state (3-dots menu)
  const [openMenuId, setOpenMenuId] = useState(null);

  // Modal State (Used for both Add & Edit modes)
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null); // null = Add, object = Edit

  // Form Fields State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSubSec, setNewSubSec] = useState("");
  const [newSem, setNewSem] = useState("");
  const [newProf, setNewProf] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newMembers, setNewMembers] = useState("");
  const [newStatus, setNewStatus] = useState("Pending");

  // Close 3-dots dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  /* ---------- Options Menu Handlers ---------- */
  const toggleMenu = (e, projId) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === projId ? null : projId);
  };

  const handleOpenAddModal = () => {
    setEditingProject(null);
    setNewTitle("");
    setNewDesc("");
    setNewSubSec("");
    setNewSem("");
    setNewProf("");
    setNewDeadline("");
    setNewMembers("");
    setNewStatus("Pending");
    setShowModal(true);
  };

  const handleOpenEditModal = (e, proj) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setEditingProject(proj);
    setNewTitle(proj.title || "");
    setNewDesc(proj.description || "");
    setNewSubSec(proj.subjectSection || "");
    setNewSem(proj.semester || "");
    setNewProf(proj.professor || "");
    setNewDeadline(proj.deadline || "");
    setNewMembers(proj.members ? proj.members.join(", ") : "");
    setNewStatus(proj.status || "Pending");
    setShowModal(true);
  };

  const handleDeleteProject = (e, projId) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (window.confirm("Are you sure you want to delete this project?")) {
      actions.deleteProject(projId);
    }
  };

  /* ---------- Modal Form Submit ---------- */
  const handleSaveProject = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const fields = {
      title: newTitle.trim(),
      status: newStatus,
      description: newDesc.trim(),
      semester: newSem.trim(),
      subjectSection: newSubSec.trim(),
      professor: newProf.trim(),
      deadline: newDeadline,
      members: newMembers
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
    };

    if (editingProject) {
      actions.updateProject(editingProject.id, fields);
    } else {
      actions.addProject(fields);
    }

    setShowModal(false);
  };

  /* ---------- Filter Logic ---------- */
  const filteredProjects = projectsList.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (p.title || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      (p.subjectSection || "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesType = typeFilter === "All" || p.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // project types only exist for projects saved on the server, so the filter appears only when there are some
  const projectTypes = [...new Set(projectsList.map((p) => p.type).filter(Boolean))];
  const hasFilters = search !== "" || statusFilter !== "All" || typeFilter !== "All";
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
  };

  /* ========================================================================= */
  /* VIEW 1: HOME  (My Projects)                                               */
  /* ========================================================================= */
  if (!selectedProject) {
    const firstName = (user?.fullName || "").split(" ")[0];

    return (
      <div className="projects-dashboard-page">
        {/* Welcome banner */}
        <div className="hero">
          <div className="hero-text">
            <div className="eyebrow">
              <Icon name="sparkle" size={16} /> Academic Dashboard
            </div>
            <h1>
              Welcome back{firstName ? `, ${firstName}!` : "!"} <span aria-hidden="true">👋</span>
            </h1>
            <p>
              Track instructor feedback, manage academic revisions, and organize your chapters
              seamlessly.
            </p>
          </div>
          <button className="btn btn-with-icon" onClick={handleOpenAddModal}>
            <Icon name="plus" size={18} />
            <span>Create New Project</span>
          </button>
        </div>

        {/* Section title + count */}
        <div className="section-head">
          <div>
            <div className="section-title">
              <h2>My Projects</h2>
              <span className="pill">{projectsList.length} Projects</span>
            </div>
            <p className="muted">Manage your thesis, capstone, and research assignments</p>
          </div>

          {/* Toolbar: Search + Filters */}
          <div className="toolbar-inline">
            <div className="search-field">
              <Icon name="search" size={18} />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search projects"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {projectTypes.length > 0 && (
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by type">
                <option value="All">All Types</option>
                {projectTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Pop-up Form Modal (Add / Edit) */}
        {showModal && (
          <div className="modal-backdrop" onClick={() => setShowModal(false)}>
            <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="card-head">
                <h3>{editingProject ? "Edit Project" : "Add New Project"}</h3>
                <button
                  type="button"
                  className="btn ghost small danger"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>

              <form className="form row" onSubmit={handleSaveProject}>
                <label className="full">
                  Project Title *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Campus Shuttle Tracker"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </label>

                <label>
                  Subject – Section *
                  <input
                    type="text"
                    required
                    placeholder="e.g. IT 412 - CS4A"
                    value={newSubSec}
                    onChange={(e) => setNewSubSec(e.target.value)}
                  />
                </label>

                <label>
                  Semester (optional)
                  <input
                    type="text"
                    placeholder="e.g. 1st Semester 2026-2027"
                    value={newSem}
                    onChange={(e) => setNewSem(e.target.value)}
                  />
                </label>

                <label>
                  Professor (optional)
                  <input
                    type="text"
                    placeholder="e.g. Dr. Maria Santos"
                    value={newProf}
                    onChange={(e) => setNewProf(e.target.value)}
                  />
                </label>

                <label>
                  Deadline
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                  />
                </label>

                <label>
                  Status
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="full">
                  Members (comma-separated)
                  <input
                    type="text"
                    placeholder="Ana Reyes, Marco Diaz, Ken Tan"
                    value={newMembers}
                    onChange={(e) => setNewMembers(e.target.value)}
                  />
                </label>

                <label className="full">
                  Description
                  <textarea
                    rows="3"
                    placeholder="Short summary or overview of the project..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </label>

                <div className="btn-row full" style={{ justifyContent: "flex-end" }}>
                  <button type="button" className="btn ghost" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn">
                    {editingProject ? "Update Project" : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Project cards grid */}
        {filteredProjects.length === 0 ? (
          <div className="card empty-state">
            <Empty
              text={
                projectsList.length === 0
                  ? "You don't have any projects yet. Create one to start tracking feedback and revisions."
                  : "No projects match your search or filters."
              }
            />
            <div className="btn-row" style={{ justifyContent: "center" }}>
              {hasFilters && (
                <button type="button" className="btn ghost" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
              {projectsList.length === 0 && (
                <button type="button" className="btn btn-with-icon" onClick={handleOpenAddModal}>
                  <Icon name="plus" size={18} />
                  <span>Create your first project</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="project-grid">
            {filteredProjects.map((p) => {
              const progress = projectProgress(p);
              const memberCount = (p.members || []).length;

              return (
                <div
                  key={p.id}
                  className="card project-card"
                  onClick={() => setSelectedProject(p)}
                >
                  <div>
                    {/* Top row: type / subject chip, status badge */}
                    <div className="pc-top">
                      <span className="chip-soft">{p.type || p.subjectSection || "Project"}</span>
                      <StatusBadge status={p.status} />
                    </div>

                    <h3 className="pc-title" title={p.title}>{p.title}</h3>
                    <p className="muted pc-desc">{p.description || "No description yet."}</p>
                    {(p.subjectSection || p.professor) && (
                      <p className="pc-meta muted">
                        {[p.subjectSection, p.professor].filter(Boolean).join(" • ")}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="pc-progress-label">
                      <span className="muted">Overall Progress</span>
                      <strong>{progress}%</strong>
                    </div>
                    <ProgressBar value={progress} />

                    <div className="pc-footer">
                      <span>
                        <Icon name="calendar" size={15} /> Due: {p.deadline ? formatDate(p.deadline) : "—"}
                      </span>
                      <span>
                        <Icon name="users" size={15} /> {memberCount} member{memberCount === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="pc-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn ghost open-btn btn-with-icon"
                        onClick={() => setSelectedProject(p)}
                      >
                        <Icon name="folder" size={18} />
                        <span>Open Project</span>
                      </button>
                      <div className="menu-wrap">
                        <button
                          type="button"
                          className="icon-btn outlined"
                          onClick={(e) => toggleMenu(e, p.id)}
                          aria-label="Project Options"
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === p.id}
                        >
                          <Icon name="dots" size={18} />
                        </button>

                        {openMenuId === p.id && (
                          <div className="menu" role="menu" onClick={(e) => e.stopPropagation()}>
                            <button type="button" role="menuitem" onClick={(e) => handleOpenEditModal(e, p)}>
                              Edit Project
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="danger"
                              onClick={(e) => handleDeleteProject(e, p.id)}
                            >
                              Delete Project
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ========================================================================= */
  /* VIEW 2: PROJECT DASHBOARD                                                 */
  /* ========================================================================= */
  const { components = [], history = [], revisions = [], feedback = [], tasks = [] } = data || {};

  const overall = components.length
    ? Math.round(components.reduce((s, c) => s + (c.progress || 0), 0) / components.length)
    : 0;

  const approvedCount = components.filter((c) => c.status === "Approved").length;
  const pendingTasks = tasks.filter((t) => t.status !== "Done").length;
  const completedTasks = tasks.filter((t) => t.status === "Done").length;
  const unresolvedFeedbackCount = feedback.filter(
    (f) => f.status !== "Resolved" && f.status !== "Closed"
  ).length;
  const pendingClarificationsCount = feedback.filter(
    (f) => f.type === "clarification" && f.status === "Open"
  ).length;

  const upcoming = components
    .filter((c) => c.status !== "Approved" && c.due)
    .sort((a, b) => a.due.localeCompare(b.due));

  // open feedback that no one has turned into a next action yet
  const unlinkedFeedback = feedback.filter(
    (f) => f.type === "feedback" && f.status === "Open" && !tasks.some((t) => t.feedbackId === f.id)
  );

  const pendingActions = [
    ...unlinkedFeedback.map((f) => ({
      id: `fb-new-${f.id}`,
      text: `Turn into a next action: ${f.text.length > 70 ? `${f.text.slice(0, 70)}…` : f.text}`,
      to: `/dashboard/feedback/details?id=${f.id}`,
    })),
    ...revisions
      .filter((r) => r.status === "For Revision")
      .map((r) => ({
        id: `rev-fr-${r.id}`,
        text: `Finish ${r.tasks ? r.tasks.filter((t) => !t.done).length : 0} revision task(s) for "${r.title}"`,
        to: "/dashboard/revisions/for-revision",
      })),
    ...revisions
      .filter((r) => r.status === "Pending")
      .map((r) => ({
        id: `rev-p-${r.id}`,
        text: `Submit "${r.title}"`,
        to: "/dashboard/revisions/pending",
      })),
    ...feedback
      .filter((f) => f.type === "clarification" && f.status === "Open")
      .map((f) => ({
        id: `fb-${f.id}`,
        text: `Clarification waiting: ${f.text}`,
        to: `/dashboard/feedback/details?id=${f.id}`,
      })),
  ];

  const statTiles = [
    { label: "Components", value: components.length, sub: "Total", tone: "primary" },
    {
      label: "Approved",
      value: approvedCount,
      sub: `${components.length ? Math.round((approvedCount / components.length) * 100) : 0}% Complete`,
      tone: "good",
    },
    { label: "Pending Tasks", value: pendingTasks, sub: "Action Required", tone: "warn" },
    { label: "Completed Tasks", value: completedTasks, sub: "Finished", tone: "good" },
    { label: "Unresolved Feedback", value: unresolvedFeedbackCount, sub: "Needs Revision", tone: "bad" },
    { label: "Clarifications", value: pendingClarificationsCount, sub: "Awaiting Reply", tone: "info" },
  ];

  return (
    <div className="dashboard-page">
      {/* Banner */}
      <div className="hero">
        <div className="hero-text">
          <div className="eyebrow">Project Workspace</div>
          <h1>{selectedProject.title}</h1>
          <p>
            {selectedProject.subjectSection}
            {selectedProject.professor ? ` • ${selectedProject.professor}` : ""}
          </p>
          {selectedProject.description && <p>{selectedProject.description}</p>}
        </div>
        <div className="hero-actions">
          <Link className="btn ghost" to="/dashboard/feedback/all">
            View Feedback
          </Link>
          <Link className="btn" to="/dashboard/feedback/add" style={{ color: "#fff" }}>
            + Add Feedback
          </Link>
        </div>
      </div>

      {/* 6 stat tiles */}
      <div className="stat-tiles">
        {statTiles.map((t) => (
          <div key={t.label} className="stat-tile">
            <span className="stat-label">{t.label}</span>
            <strong className="stat-value">{t.value}</strong>
            <span className={`stat-sub ${t.tone}`}>{t.sub}</span>
          </div>
        ))}
      </div>

      {/* Row 1: components progress (wide) + upcoming deadlines (narrow) */}
      <div className="dash-split">
        <div className="card">
          <div className="card-head">
            <h3>Components Progress</h3>
            <span className="muted">Overall: {overall}%</span>
          </div>
          <div style={{ marginBottom: 16 }}>
            <ProgressBar value={overall} />
          </div>
          {components.length === 0 ? (
            <Empty text="No components to display." />
          ) : (
            components.map((c) => (
              <div key={c.id} className="bar-row">
                <span>
                  {c.name} <StatusBadge status={c.status} />
                </span>
                <ProgressBar value={c.progress} />
                <b>{c.progress}%</b>
              </div>
            ))
          )}
        </div>

        <div className="card deadline-card">
          <div className="card-head">
            <h3>Upcoming Deadlines</h3>
          </div>
          {upcoming.length === 0 ? (
            <Empty text="No upcoming deadlines." />
          ) : (
            upcoming.slice(0, 4).map((c) => {
              const d = daysUntil(c.due);
              return (
                <div key={c.id} className="deadline-item">
                  <div className="deadline-top">
                    <StatusBadge status={c.status} />
                    <span className={d < 0 ? "danger" : d <= 7 ? "warn" : "muted"}>
                      {d < 0
                        ? `${-d} day(s) overdue`
                        : d === 0
                        ? "Due today"
                        : `${d} day(s) left`}
                    </span>
                  </div>
                  <strong>{c.name}</strong>
                  <small className="muted">Due: {formatDate(c.due)}</small>
                </div>
              );
            })
          )}
          <Link className="btn ghost full-btn" to="/dashboard/components/list">
            View All Components
          </Link>
        </div>
      </div>

      {/* Row 2: next actions + recent activity */}
      <div className="dash-split even">
        <div className="card">
          <div className="card-head">
            <h3>{`Pending (Next Required Actions) - ${pendingActions.length}`}</h3>
          </div>
          {pendingActions.length === 0 ? (
            <Empty text="You're all caught up." />
          ) : (
            pendingActions.map((i) => (
              <Link key={i.id} to={i.to} className="list-row">
                <span>{i.text}</span>
                <span>→</span>
              </Link>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Recent Activities</h3>
            <Link to="/dashboard/history/timeline">View full timeline →</Link>
          </div>
          {history.length === 0 ? (
            <Empty text="No recent activities recorded." />
          ) : (
            history.slice(0, 6).map((h) => <CommitRow key={h.id} entry={h} />)
          )}
        </div>
      </div>
    </div>
  );
}