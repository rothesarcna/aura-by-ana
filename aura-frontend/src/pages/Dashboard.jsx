import { useMemo, useState } from "react";
import "./dashboard.css";

/* ---------- Sample data (replace with your API / database) ---------- */

const PROJECT = {
  name: "Capstone research project",
  phase: "Adviser review",
  type: "Group project",
  adviser: "Adviser review in progress",
};

const NAV_MENU = [
  "Overview",
  "Projects",
  "Components",
  "Feedback & Issues",
  "Revision Reviews",
  "Tasks & Milestones",
  "Revision History",
  "Files & Links",
];
const NAV_ACCOUNT = ["User Account", "Team", "Notifications", "Settings", "Help & Guide"];

const TABS = ["Overview", "Components", "Feedback", "Revisions", "Files", "Activity"];

// The feedback-to-approval workflow. Every issue sits at exactly one stage.
const STAGES = [
  { key: "recorded", label: "Feedback recorded" },
  { key: "assigned", label: "Action assigned" },
  { key: "revising", label: "Revising" },
  { key: "group", label: "Group review" },
  { key: "adviser", label: "Adviser review" },
  { key: "approved", label: "Approved" },
];

const ISSUES = [
  { id: "FB-014", title: "Strengthen the justification of the research problem", component: "Chapter 1", assignee: "Maria", priority: "High", stage: "revising", due: "Nov 2", clarify: false },
  { id: "FB-015", title: "Research objectives are too broad; make them measurable", component: "Chapter 1", assignee: "Jon", priority: "High", stage: "group", due: "Oct 30", clarify: false },
  { id: "FB-016", title: "Add recent studies to the related literature", component: "Chapter 2", assignee: "Ana", priority: "Medium", stage: "adviser", due: "Oct 29", clarify: false },
  { id: "FB-017", title: "Clarify the sampling method for survey respondents", component: "Chapter 3", assignee: "Unassigned", priority: "Medium", stage: "recorded", due: "Nov 6", clarify: true },
  { id: "FB-018", title: "Earlier advice said to cut the scope; new advice says expand it", component: "Chapter 1", assignee: "Unassigned", priority: "High", stage: "recorded", due: "Nov 4", clarify: true },
  { id: "FB-019", title: "Align the system architecture diagram with the methodology", component: "Prototype", assignee: "Luis", priority: "Medium", stage: "assigned", due: "Nov 8", clarify: false },
  { id: "FB-020", title: "Revise the survey instrument wording", component: "Chapter 3", assignee: "Ana", priority: "Low", stage: "revising", due: "Nov 9", clarify: false },
  { id: "FB-021", title: "Fix citation format in the references list", component: "Documentation", assignee: "Jon", priority: "Low", stage: "group", due: "Nov 1", clarify: false },
  { id: "FB-012", title: "Rewrite the abstract to state the findings", component: "Proposal", assignee: "Maria", priority: "Medium", stage: "approved", due: "Oct 20", clarify: false },
  { id: "FB-010", title: "Add a definition of terms section", component: "Chapter 1", assignee: "Luis", priority: "Low", stage: "approved", due: "Oct 15", clarify: false },
];

const COMPONENTS = [
  { name: "Proposal", status: "Approved", due: "Oct 20", progress: 100, owner: "Maria" },
  { name: "Chapter 1: Introduction", status: "For Revision", due: "Nov 2", progress: 60, owner: "Maria" },
  { name: "Chapter 2: Related literature", status: "Under Review", due: "Oct 29", progress: 85, owner: "Ana" },
  { name: "Chapter 3: Methodology", status: "For Revision", due: "Nov 9", progress: 40, owner: "Ana" },
  { name: "Prototype", status: "Pending", due: "Nov 15", progress: 25, owner: "Luis" },
  { name: "Final presentation", status: "Pending", due: "Nov 28", progress: 5, owner: "Jon" },
];

const DEADLINES = [
  { label: "Chapter 2 adviser review", when: "Oct 29", note: "Tomorrow" },
  { label: "Revised objectives to group", when: "Oct 30", note: "In 2 days" },
  { label: "Chapter 1 resubmission", when: "Nov 2", note: "In 5 days" },
  { label: "Methodology consultation", when: "Nov 6", note: "In 9 days" },
];

const ACTIVITY = [
  { who: "Ana", what: "submitted Chapter 2 for adviser review", ref: "RR-006", time: "2 hours ago" },
  { who: "Jon", what: "opened a group review for the revised objectives", ref: "FB-015", time: "Yesterday" },
  { who: "Maria", what: "flagged a clarification question on the research scope", ref: "FB-018", time: "Yesterday" },
  { who: "Luis", what: "marked the definition of terms as approved", ref: "FB-010", time: "Oct 26" },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, "-");

/* ---------- Small pieces ---------- */

function PipelineStrip({ counts, active, onSelect }) {
  return (
    <section className="aura-pipeline" aria-label="Feedback workflow">
      <ol className="aura-pipeline-list">
        {STAGES.map((stage) => {
          const isActive = active === stage.key;
          return (
            <li key={stage.key} className="aura-pipeline-item">
              <button
                type="button"
                className={`aura-stage${isActive ? " is-active" : ""}`}
                aria-pressed={isActive}
                onClick={() => onSelect(isActive ? null : stage.key)}
              >
                <span className="aura-stage-count">{counts[stage.key]}</span>
                <span className="aura-stage-label">{stage.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="aura-pipeline-hint">
        {active
          ? `Showing issues at "${STAGES.find((s) => s.key === active).label}". Select it again to clear.`
          : "Select a stage to filter the issues below."}
      </p>
    </section>
  );
}

function IssueList({ issues, query, onQuery }) {
  return (
    <section className="aura-panel" aria-labelledby="issues-title">
      <header className="aura-panel-head">
        <h2 id="issues-title">Feedback issues</h2>
        <input
          type="search"
          className="aura-search"
          placeholder="Search by ID, title, or member"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          aria-label="Search feedback issues"
        />
      </header>
      {issues.length === 0 ? (
        <p className="aura-empty">No issues match. Clear the search or pick a different stage.</p>
      ) : (
        <ul className="aura-issues">
          {issues.map((issue) => (
            <li key={issue.id} className="aura-issue">
              <span className={`aura-priority is-${slug(issue.priority)}`} title={`${issue.priority} priority`} />
              <div className="aura-issue-main">
                <p className="aura-issue-title">
                  <span className="aura-issue-id">{issue.id}</span> {issue.title}
                </p>
                <p className="aura-issue-meta">
                  {issue.component}, assigned to {issue.assignee}, due {issue.due}
                </p>
              </div>
              <div className="aura-issue-tags">
                {issue.clarify && <span className="aura-chip is-clarify">Needs clarification</span>}
                <span className="aura-chip">{STAGES.find((s) => s.key === issue.stage).label}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ComponentTable({ components }) {
  return (
    <section className="aura-panel" aria-labelledby="components-title">
      <header className="aura-panel-head">
        <h2 id="components-title">Components</h2>
      </header>
      <div className="aura-table-wrap">
        <table className="aura-table">
          <thead>
            <tr>
              <th scope="col">Component</th>
              <th scope="col">Status</th>
              <th scope="col">Due</th>
              <th scope="col">Progress</th>
            </tr>
          </thead>
          <tbody>
            {components.map((c) => (
              <tr key={c.name}>
                <th scope="row">
                  {c.name}
                  <span className="aura-subtle">{c.owner}</span>
                </th>
                <td>
                  <span className={`aura-status is-${slug(c.status)}`}>{c.status}</span>
                </td>
                <td>{c.due}</td>
                <td>
                  <div
                    className="aura-bar"
                    role="progressbar"
                    aria-valuenow={c.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${c.name} progress`}
                  >
                    <span style={{ width: `${c.progress}%` }} />
                  </div>
                  <span className="aura-subtle">{c.progress}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Deadlines() {
  return (
    <section className="aura-panel" aria-labelledby="deadlines-title">
      <header className="aura-panel-head">
        <h2 id="deadlines-title">Upcoming deadlines</h2>
      </header>
      <ul className="aura-list">
        {DEADLINES.map((d) => (
          <li key={d.label}>
            <span>{d.label}</span>
            <span className="aura-subtle">
              {d.when}, {d.note}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActivityFeed() {
  return (
    <section className="aura-panel" aria-labelledby="activity-title">
      <header className="aura-panel-head">
        <h2 id="activity-title">Recent activity</h2>
      </header>
      <ul className="aura-feed">
        {ACTIVITY.map((a) => (
          <li key={a.ref + a.time}>
            <span className="aura-avatar" aria-hidden="true">
              {a.who[0]}
            </span>
            <p>
              <strong>{a.who}</strong> {a.what} <span className="aura-issue-id">{a.ref}</span>
              <span className="aura-subtle">{a.time}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyTab({ title, body, action }) {
  return (
    <section className="aura-panel aura-panel-empty">
      <h2>{title}</h2>
      <p className="aura-empty">{body}</p>
      <button type="button" className="aura-btn">
        {action}
      </button>
    </section>
  );
}

/* ---------- Dashboard ---------- */

export default function Dashboard() {
  const [tab, setTab] = useState("Overview");
  const [stage, setStage] = useState(null);
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  const counts = useMemo(() => {
    const base = Object.fromEntries(STAGES.map((s) => [s.key, 0]));
    ISSUES.forEach((i) => (base[i.stage] += 1));
    return base;
  }, []);

  const visibleIssues = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ISSUES.filter((i) => {
      if (stage && i.stage !== stage) return false;
      if (!q) return true;
      return [i.id, i.title, i.assignee, i.component].some((v) => v.toLowerCase().includes(q));
    });
  }, [stage, query]);

  const openIssues = ISSUES.filter((i) => i.stage !== "approved").length;
  const clarifications = ISSUES.filter((i) => i.clarify).length;
  const inReview = counts.group + counts.adviser;

  return (
    <div className="aura-app">
      <aside className={`aura-sidebar${navOpen ? " is-open" : ""}`} aria-label="Main navigation">
        <div className="aura-brand">
          <span className="aura-brand-name">AURA</span>
          <span className="aura-brand-tag">Keep track of feedback. Know what to do next.</span>
        </div>
        <nav>
          <p className="aura-nav-title">Menu</p>
          <ul>
            {NAV_MENU.map((item, i) => (
              <li key={item}>
                <a href="#" className={i === 0 ? "is-current" : ""} aria-current={i === 0 ? "page" : undefined}>
                  {item}
                </a>
              </li>
            ))}
          </ul>
          <p className="aura-nav-title">Account</p>
          <ul>
            {NAV_ACCOUNT.map((item) => (
              <li key={item}>
                <a href="#">{item}</a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="aura-main">
        <button
          type="button"
          className="aura-menu-toggle"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}
        >
          {navOpen ? "Close menu" : "Open menu"}
        </button>

        <header className="aura-header">
          <div>
            <h1>{PROJECT.name}</h1>
            <p className="aura-header-meta">
              <span className="aura-chip is-phase">{PROJECT.phase}</span>
              <span className="aura-chip">{PROJECT.type}</span>
            </p>
          </div>
          <dl className="aura-stats">
            <div>
              <dt>Open issues</dt>
              <dd>{openIssues}</dd>
            </div>
            <div>
              <dt>In review</dt>
              <dd>{inReview}</dd>
            </div>
            <div>
              <dt>Needs clarification</dt>
              <dd>{clarifications}</dd>
            </div>
          </dl>
        </header>

        <div className="aura-tabs" role="tablist" aria-label="Workspace sections">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`aura-tab${tab === t ? " is-active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Overview" && (
          <>
            <PipelineStrip counts={counts} active={stage} onSelect={setStage} />
            <div className="aura-grid">
              <div className="aura-col">
                <IssueList issues={visibleIssues} query={query} onQuery={setQuery} />
                <ComponentTable components={COMPONENTS} />
              </div>
              <div className="aura-col">
                <Deadlines />
                <ActivityFeed />
              </div>
            </div>
          </>
        )}

        {tab === "Components" && <ComponentTable components={COMPONENTS} />}

        {tab === "Feedback" && (
          <>
            <PipelineStrip counts={counts} active={stage} onSelect={setStage} />
            <IssueList issues={visibleIssues} query={query} onQuery={setQuery} />
          </>
        )}

        {tab === "Revisions" && (
          <EmptyTab
            title="Revision reviews"
            body="No revisions are waiting for group review. Submit a revised component to start one."
            action="Submit a revision"
          />
        )}

        {tab === "Files" && (
          <EmptyTab
            title="Files and links"
            body="Add research documents, references, and prototype links so the whole group works from the same versions."
            action="Add a file or link"
          />
        )}

        {tab === "Activity" && <ActivityFeed />}
      </main>
    </div>
  );
}
