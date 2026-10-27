import { useEffect, useState } from 'react'
import './Dashboard.css'

/* ---------- dates (demo data is relative to today, so it never looks stale) ---------- */
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const day = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}
const TODAY = day(0)
const daysUntil = (date) => Math.round((new Date(`${date}T00:00:00`) - new Date(`${TODAY}T00:00:00`)) / 86400000)

const newId = () => Date.now() + Math.floor(Math.random() * 100000)
const newToken = () => Math.random().toString(36).slice(2, 10)
const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date')
const safeUrl = (u) => /^https?:\/\//i.test(u || '')
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`

/* ---------- constants ---------- */
const ROLES = ['Leader', 'Member', 'Viewer']
const SOURCES = ['Adviser', 'Panelist', 'Professor']
const TASK_STATUSES = ['To do', 'In progress', 'Done']
const COMPONENT_STATUSES = ['Pending', 'Submitted', 'Under Review', 'For Revision', 'Resubmitted', 'Approved']
const FEEDBACK_STATUSES = ['New', 'In progress', 'Needs answer', 'Needs sorting', 'Done', 'Replaced']
const UNSORTED = 'unsorted'
const TEMPLATE = ['Proposal', 'Ch1 — Objectives', 'Ch2 — Related Literature', 'Ch3 — Methodology', 'Ch4 — Results', 'Ch5 — Conclusion']
const FINISHED = ['Submitted', 'Under Review', 'Resubmitted', 'Approved']

const FB0 = { q: '', status: 'All', comp: 'All', from: '', to: '' }
const TASK0 = { q: '', status: 'All', who: 'All', comp: 'All' }
const COMP0 = { q: '', status: 'All' }

const pages = [
  { id: 'overview', label: 'Overview', icon: '▦' },
  { id: 'components', label: 'Components', icon: '▤' },
  { id: 'feedback', label: 'Feedback', icon: '✎' },
  { id: 'tasks', label: 'Tasks', icon: '☑' },
  { id: 'report', label: 'Revision report', icon: '⇩' },
  { id: 'members', label: 'Members', icon: '☺' },
]

const pageInfo = {
  overview: { eyebrow: 'WHERE THINGS STAND', title: 'Overview', description: 'Project progress, what needs attention, and what to bring to your next consultation.' },
  components: { eyebrow: 'YOUR DELIVERABLES', title: 'Components', description: 'Each chapter or deliverable has a deadline, submissions, and its own feedback story.' },
  feedback: { eyebrow: 'WHAT DID THEY SAY?', title: 'Feedback', description: 'Search every comment. Click one to add tasks, revisions, and questions.' },
  tasks: { eyebrow: 'WHAT SHOULD WE DO NEXT?', title: 'Tasks', description: 'Your own work first. Switch to Everyone to see the whole group.' },
  report: { eyebrow: 'FOR YOUR DEFENSE', title: 'Revision report', description: 'Comment → what we did → why. Download it as a spreadsheet.' },
  members: { eyebrow: 'YOUR GROUP', title: 'Members', description: 'Invite your group and decide who can do what.' },
}

const statusClass = {
  New: 'needs-revision', 'In progress': 'in-progress', 'Needs answer': 'needs-clarification', 'Needs sorting': 'needs-clarification',
  Done: 'completed', Replaced: 'superseded',
  Pending: 'superseded', Submitted: 'in-progress', 'Under Review': 'needs-clarification',
  'For Revision': 'needs-revision', Resubmitted: 'in-progress', Approved: 'completed',
}

/* ---------- demo data ---------- */
const initialProjects = [{ id: 'p1', name: 'Thesis — Plastic Waste Study', description: 'Group thesis for the second semester.' }]

const initialMembers = [
  { id: 'm1', name: 'Alex', role: 'Leader', removed: false },
  { id: 'm2', name: 'Bea', role: 'Member', removed: false },
  { id: 'm3', name: 'Carlo', role: 'Member', removed: false },
  { id: 'm4', name: 'Dr. Reyes', role: 'Viewer', removed: false },
]

const initialComponents = [
  { id: 'c1', projectId: 'p1', name: 'Proposal', deadline: day(-30), status: 'Approved', archived: false },
  { id: 'c2', projectId: 'p1', name: 'Ch1 — Objectives', deadline: day(4), status: 'For Revision', archived: false },
  { id: 'c3', projectId: 'p1', name: 'Ch2 — Related Literature', deadline: day(9), status: 'Under Review', archived: false },
  { id: 'c4', projectId: 'p1', name: 'Ch3 — Methodology', deadline: day(2), status: 'For Revision', archived: false },
  { id: 'c5', projectId: 'p1', name: 'Ch4 — Results', deadline: day(30), status: 'Pending', archived: false },
  { id: 'c6', projectId: 'p1', name: 'Prototype', deadline: day(45), status: 'Pending', archived: false },
]

const initialFeedback = [
  { id: 1, projectId: 'p1', ref: 'FDB-001', componentId: 'c2', source: 'Adviser', comment: 'Your research objectives are too broad.', date: day(-6), recordedBy: 'm1', meaning: 'Each objective should name a variable and a measurable outcome.', confirmed: false, doneWhen: 'Every objective names a variable and a measure.', link: '', relation: null, relatesTo: null },
  { id: 2, projectId: 'p1', ref: 'FDB-002', componentId: 'c3', source: 'Adviser', comment: 'Add more supporting sources to this section.', date: day(-5), recordedBy: 'm1', meaning: '', confirmed: false, doneWhen: '', link: '', relation: null, relatesTo: null },
  { id: 3, projectId: 'p1', ref: 'FDB-003', componentId: 'c3', source: 'Panelist 1', comment: 'That is too many sources for a statement we never discuss. Keep two at most.', date: day(-4), recordedBy: 'm2', meaning: '', confirmed: false, doneWhen: '', link: '', relation: 'conflicts', relatesTo: 2 },
  { id: 4, projectId: 'p1', ref: 'FDB-004', componentId: 'c4', source: 'Professor', comment: 'Explain why this research method was selected.', date: day(-4), recordedBy: 'm2', meaning: '', confirmed: false, doneWhen: '', link: '', relation: null, relatesTo: null },
]

const initialTasks = [
  { id: 1, fid: 1, title: 'Rewrite the objectives to be specific and measurable.', assigneeId: 'm2', deadline: day(4), hours: '2', status: 'In progress' },
  { id: 2, fid: 2, title: 'Find more supporting sources.', assigneeId: 'm3', deadline: day(6), hours: '', status: 'To do' },
  { id: 3, fid: 4, title: 'Write the justification for the chosen method.', assigneeId: 'm1', deadline: day(-1), hours: '', status: 'In progress' },
]

const initialReceipts = [
  { id: 1, fid: 1, date: day(-3), what: 'Rewrote the objectives to name the specific variables and outcomes.', why: 'The original objectives had no variables or targets.', byId: 'm2' },
]

const initialQuestions = [
  { id: 1, fids: [3, 2], kind: 'conflict', text: 'FDB-003 (Panelist 1) contradicts FDB-002 (Adviser). How many sources do we keep?', date: day(-4), resolved: false, answer: '' },
]

const initialSubmissions = [
  { id: 1, componentId: 'c1', date: day(-35), label: 'Submission 1', note: 'Proposal defense copy', link: '', byId: 'm1' },
  { id: 2, componentId: 'c2', date: day(-10), label: 'Submission 1', note: 'First full draft', link: '', byId: 'm1' },
  { id: 3, componentId: 'c3', date: day(-8), label: 'Submission 1', note: 'Draft 1', link: '', byId: 'm1' },
]

const initialEvents = [
  { id: 1, projectId: 'p1', componentId: 'c2', date: day(-3), byId: 'm2', text: 'Revision logged for FDB-001.' },
  { id: 2, projectId: 'p1', componentId: 'c3', date: day(-4), byId: 'm2', text: 'FDB-003 (Panelist 1) recorded, contradicting FDB-002.' },
  { id: 3, projectId: 'p1', componentId: 'c2', date: day(-6), byId: 'm1', text: 'Ch1 — Objectives: Under Review → For Revision.' },
  { id: 4, projectId: 'p1', componentId: 'c3', date: day(-8), byId: 'm1', text: 'Submission 1 recorded for Ch2 — Related Literature. Status: Submitted.' },
]

/* ---------- saves to the browser so a refresh keeps your data ---------- */
function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage full or blocked: the app still works, it just won't remember */
    }
  }, [key, value])
  return [value, setValue]
}

/* ---------- small pieces ---------- */
function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${statusClass[status] || ''}`}>
      <span className="status-dot"></span>
      {status}
    </span>
  )
}

function Bar({ pct }) {
  return (
    <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
      <span style={{ width: `${pct}%` }} />
    </div>
  )
}

function Search({ label, value, onChange }) {
  return (
    <div className="search-wrap">
      <span className="search-icon">⌕</span>
      <input type="search" aria-label={label} placeholder={label} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function Pick({ label, value, onChange, options }) {
  return (
    <select className="form-select inline" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  )
}

function AddRow({ fields, onAdd, label = 'Add' }) {
  const blank = Object.fromEntries(fields.map((f) => [f.key, '']))
  const [v, setV] = useState(blank)
  return (
    <form
      className="mini-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!v[fields[0].key].trim()) return
        onAdd(v)
        setV(blank)
      }}
    >
      {fields.map((f) =>
        f.options ? (
          <select key={f.key} aria-label={f.ph} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })}>
            <option value="">{f.ph}</option>
            {f.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        ) : (
          <input key={f.key} className={f.grow ? 'grow' : ''} type={f.type || 'text'} placeholder={f.ph} aria-label={f.ph}
            value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
        )
      )}
      <button type="submit" className="secondary-button">{label}</button>
    </form>
  )
}

function QuestionRow({ q, canEdit, onResolve, onReopen }) {
  const [a, setA] = useState('')
  return (
    <div className="mini-row">
      <div>
        <strong>{q.kind === 'conflict' && '⚑ '}{q.text}</strong>
        <span className="mini-meta">{q.resolved ? `Answered: ${q.answer || 'clarified'}` : 'Open: ask at the next consultation'}</span>
      </div>
      {canEdit && (q.resolved ? (
        <button type="button" className="text-button" onClick={() => onReopen(q.id)}>Reopen</button>
      ) : (
        <div className="inline-row">
          <input type="text" aria-label="Answer" placeholder="Answer (optional)" value={a} onChange={(e) => setA(e.target.value)} />
          <button type="button" className="secondary-button" onClick={() => onResolve(q.id, a)}>Resolve</button>
        </div>
      ))}
    </div>
  )
}

function Block({ id, eyebrow, title, rows }) {
  return (
    <section className="page-section" id={id}>
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      </div>
      {rows.length ? <div className="activity-feed">{rows}</div> : <p className="helper">Nothing here ✓</p>}
    </section>
  )
}

/* Rule: only the assignee or the Leader can change a task. */
function TaskControls({ t, ctx, act }) {
  const { me, members, canChangeTask } = ctx
  const isLeader = me.role === 'Leader'
  const can = canChangeTask(t)
  const assignable = members.filter((m) => !m.removed && m.role !== 'Viewer')
  return (
    <div className="task-controls">
      {isLeader ? (
        <select aria-label="Assignee" value={t.assigneeId || ''} onChange={(e) => act.assign(t.id, e.target.value)}>
          <option value="">Unassigned</option>
          {assignable.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      ) : !t.assigneeId && me.role === 'Member' ? (
        <button type="button" className="secondary-button" onClick={() => act.assign(t.id, me.id)}>Claim</button>
      ) : null}
      <input type="date" aria-label="Deadline" value={t.deadline || ''} disabled={!can} onChange={(e) => act.setDeadline(t.id, e.target.value)} />
      <select
        aria-label="Task status"
        value={t.status}
        disabled={!can}
        title={can ? '' : 'Only the assignee or the Leader can change this task'}
        onChange={(e) => act.setTaskStatus(t.id, e.target.value)}
      >
        {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
      </select>
    </div>
  )
}

/* ---------- modals ---------- */
function ProjectModal({ mode, project, onSave, onClose }) {
  const [d, setD] = useState({ name: mode === 'edit' ? project.name : '', description: mode === 'edit' ? project.description : '', template: true })
  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <form className="details-modal" role="dialog" aria-modal="true" aria-labelledby="proj-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); if (d.name.trim()) onSave(d) }}>
        <div className="modal-header">
          <div>
            <span className="section-eyebrow">{mode === 'edit' ? 'EDIT PROJECT' : 'NEW PROJECT'}</span>
            <h2 id="proj-title">{mode === 'edit' ? 'Project details' : 'Start a project'}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="feedback-form modal-form">
          <label htmlFor="p-name">Project name</label>
          <input id="p-name" autoFocus value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="e.g. Capstone — Smart Attendance" required />
          <label htmlFor="p-desc">Short description (optional)</label>
          <textarea id="p-desc" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
          {mode === 'new' && (
            <label className="check-row">
              <input type="checkbox" checked={d.template} onChange={(e) => setD({ ...d, template: e.target.checked })} />
              Start with a standard thesis outline (Proposal + Ch1 to Ch5). You can change it later.
            </label>
          )}
        </div>
        <div className="form-buttons modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button">Save project</button>
        </div>
      </form>
    </div>
  )
}

/* Quick capture: only the comment is required */
function Capture({ feedback, comps, onSave, onClose }) {
  const [d, setD] = useState({ comment: '', source: 'Adviser', componentId: '', date: TODAY, relatesTo: '', relation: 'updates' })
  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <form className="details-modal" role="dialog" aria-modal="true" aria-labelledby="cap-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); if (d.comment.trim()) onSave(d) }}>
        <div className="modal-header">
          <div>
            <span className="section-eyebrow">QUICK CAPTURE</span>
            <h2 id="cap-title">What did they say?</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="feedback-form modal-form">
          <label htmlFor="c-comment">Comment (only this is required)</label>
          <textarea id="c-comment" autoFocus value={d.comment} onChange={(e) => setD({ ...d, comment: e.target.value })} placeholder="Type it as you heard it…" required />

          <label htmlFor="c-source">Who said it?</label>
          <input id="c-source" list="sources" value={d.source} onChange={(e) => setD({ ...d, source: e.target.value })} />

          <label htmlFor="c-comp">Which component? (can sort later)</label>
          <select id="c-comp" className="form-select" value={d.componentId} onChange={(e) => setD({ ...d, componentId: e.target.value })}>
            <option value="">Not sure yet</option>
            {comps.filter((c) => !c.archived).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <label htmlFor="c-date">Date</label>
          <input id="c-date" type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} />

          {feedback.length > 0 && (
            <>
              <label htmlFor="c-rel">Related to earlier feedback? (optional)</label>
              <select id="c-rel" className="form-select" value={d.relatesTo} onChange={(e) => setD({ ...d, relatesTo: e.target.value })}>
                <option value="">No, this is new</option>
                {feedback.map((f) => <option key={f.id} value={f.id}>{f.ref} · {f.source} — {f.comment.slice(0, 40)}</option>)}
              </select>
              {d.relatesTo && (
                <select className="form-select" aria-label="Relation" value={d.relation} onChange={(e) => setD({ ...d, relation: e.target.value })}>
                  <option value="updates">This replaces it (old one is kept in history)</option>
                  <option value="conflicts">This contradicts it (adds a question to ask)</option>
                </select>
              )}
            </>
          )}
        </div>

        <div className="form-buttons modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button">Save</button>
        </div>
      </form>
    </div>
  )
}

/* The one place where tasks, revisions and questions are created */
function Detail({ item, status, ctx, act, onClose, onOpen }) {
  const { feedback, tasks, receipts, questions, comps, members, nameOf, compName, canEdit } = ctx
  const rel = feedback.find((f) => f.id === item.relatesTo)
  const later = feedback.filter((f) => f.relatesTo === item.id)
  const myT = tasks.filter((t) => t.fid === item.id)
  const myR = receipts.filter((r) => r.fid === item.id)
  const myQ = questions.filter((q) => q.fids.includes(item.id))
  const assignable = members.filter((m) => !m.removed && m.role !== 'Viewer')
  const compOptions = comps.filter((c) => !c.archived || c.id === item.componentId)
  const link = (f) => <button type="button" className="text-button" onClick={() => onOpen(f.id)}>{f.ref}</button>

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <section className="details-modal wide" role="dialog" aria-modal="true" aria-labelledby="d-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="section-eyebrow">{item.ref} · {fmt(item.date)}<span className="pill">{item.source}</span></span>
            <h2 id="d-title">{compName(item.componentId)}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <blockquote className="instructor-comment big">“{item.comment}”</blockquote>
        <div className="detail-status">
          <StatusBadge status={status} />
          <span className="helper">Recorded by {nameOf(item.recordedBy)}</span>
          {safeUrl(item.link) && <a className="ext-link" href={item.link} target="_blank" rel="noreferrer">Open linked material ↗</a>}
        </div>

        {!canEdit && <p className="readonly-note">You are a Viewer. You can read everything, but not edit.</p>}

        {(rel || later.length > 0) && (
          <div className="link-note">
            {rel && <span>{item.relation === 'updates' ? '↰ Replaces' : '⚑ Contradicts'} {link(rel)} ({rel.source})</span>}
            {later.map((l) => <span key={l.id}>{l.relation === 'updates' ? '↱ Replaced by' : '⚑ Contradicted by'} {link(l)} ({l.source})</span>)}
          </div>
        )}

        <div className="edit-grid">
          <label>Component
            <select disabled={!canEdit} value={item.componentId || ''} onChange={(e) => act.update(item.id, { componentId: e.target.value || null })}>
              <option value="">Not sorted yet</option>
              {compOptions.map((c) => <option key={c.id} value={c.id}>{c.name}{c.archived ? ' (archived)' : ''}</option>)}
            </select>
          </label>
          <label>Who said it
            <input disabled={!canEdit} list="sources" value={item.source} onChange={(e) => act.update(item.id, { source: e.target.value })} />
          </label>
          <label>What we think it means
            <input disabled={!canEdit} value={item.meaning} placeholder="Our reading of the comment" onChange={(e) => act.update(item.id, { meaning: e.target.value })} />
          </label>
          <label>What would “done” look like?
            <input disabled={!canEdit} value={item.doneWhen} placeholder="e.g. exactly 2 sources" onChange={(e) => act.update(item.id, { doneWhen: e.target.value })} />
          </label>
          <label>Link to the document or section
            <input disabled={!canEdit} value={item.link || ''} placeholder="https://… (optional)" onChange={(e) => act.update(item.id, { link: e.target.value })} />
          </label>
        </div>
        <label className="check-row">
          <input type="checkbox" disabled={!canEdit} checked={item.confirmed} onChange={(e) => act.update(item.id, { confirmed: e.target.checked })} />
          Our reading was confirmed with the instructor
        </label>

        <div className="modal-section">
          <h3>Tasks ({myT.length})</h3>
          {myT.map((t) => (
            <div className="mini-row" key={t.id}>
              <div>
                <strong>{t.title}</strong>
                <span className="mini-meta">
                  {nameOf(t.assigneeId)}{t.hours && ` · ${t.hours}h`}
                  {t.deadline && t.deadline < TODAY && t.status !== 'Done' && <span className="flag"> · Overdue</span>}
                </span>
              </div>
              <TaskControls t={t} ctx={ctx} act={act} />
            </div>
          ))}
          {canEdit && (
            <AddRow onAdd={(v) => act.addTask(item.id, v)} fields={[
              { key: 'title', ph: 'Add a task…', grow: true },
              { key: 'assigneeId', ph: 'Assign to…', options: assignable },
              { key: 'deadline', ph: 'Due date', type: 'date' },
              { key: 'hours', ph: 'Hours', type: 'number' },
            ]} />
          )}
        </div>

        <div className="modal-section">
          <h3>What we changed, and why ({myR.length})</h3>
          {myR.map((r) => (
            <div className="mini-row" key={r.id}>
              <div>
                <strong>{r.what}</strong>
                <span className="mini-meta">{nameOf(r.byId)} · {fmt(r.date)}{r.why && ` · Why: ${r.why}`}</span>
              </div>
            </div>
          ))}
          {canEdit && (
            <AddRow onAdd={(v) => act.addReceipt(item.id, v)} fields={[
              { key: 'what', ph: 'What did you change?', grow: true }, { key: 'why', ph: 'Why?' },
            ]} />
          )}
        </div>

        <div className="modal-section">
          <h3>Questions to ask ({myQ.length})</h3>
          {myQ.map((q) => <QuestionRow key={q.id} q={q} canEdit={canEdit} onResolve={act.resolveQ} onReopen={act.reopenQ} />)}
          {canEdit && <AddRow onAdd={(v) => act.addQuestion(item.id, v.text)} fields={[{ key: 'text', ph: 'Something unclear?', grow: true }]} />}
        </div>

        <div className="form-buttons modal-actions">
          <button type="button" className="primary-button" onClick={onClose}>Done</button>
        </div>
      </section>
    </div>
  )
}

/* ================= main ================= */
function Dashboard() {
  const [projects, setProjects] = useStored('aura:projects', initialProjects)
  const [components, setComponents] = useStored('aura:components', initialComponents)
  const [feedbackAll, setFeedbackAll] = useStored('aura:feedback', initialFeedback)
  const [tasksAll, setTasksAll] = useStored('aura:tasks', initialTasks)
  const [receiptsAll, setReceiptsAll] = useStored('aura:receipts', initialReceipts)
  const [questionsAll, setQuestionsAll] = useStored('aura:questions', initialQuestions)
  const [submissionsAll, setSubmissionsAll] = useStored('aura:submissions', initialSubmissions)
  const [eventsAll, setEventsAll] = useStored('aura:events', initialEvents)
  const [members, setMembers] = useStored('aura:members', initialMembers)

  const [meId, setMeId] = useState('m1')
  const [projectId, setProjectId] = useState(initialProjects[0].id)
  const [inviteToken, setInviteToken] = useState('k3x9qa72')
  const [inviteRole, setInviteRole] = useState('Member')
  const [copied, setCopied] = useState(false)

  const [page, setPage] = useState('overview')
  const [overviewTab, setOverviewTab] = useState('Progress')
  const [compOpen, setCompOpen] = useState(null)
  const [editingComps, setEditingComps] = useState(false)
  const [taskTab, setTaskTab] = useState('Mine')
  const [fbFilter, setFbFilter] = useState(FB0)
  const [taskFilter, setTaskFilter] = useState(TASK0)
  const [compFilter, setCompFilter] = useState(COMP0)
  const [selectedId, setSelectedId] = useState(null)
  const [capturing, setCapturing] = useState(false)
  const [projectModal, setProjectModal] = useState(null)
  const [darkMode, setDarkMode] = useState(false)

  /* ----- who am I, and what may I do ----- */
  const activeMembers = members.filter((m) => !m.removed)
  const me = members.find((m) => m.id === meId) || members[0]
  const isLeader = me.role === 'Leader'
  const canEdit = me.role !== 'Viewer'
  const canChangeTask = (t) => canEdit && (isLeader || t.assigneeId === me.id)
  const leaderCount = activeMembers.filter((m) => m.role === 'Leader').length

  /* ----- everything below is scoped to the current project ----- */
  const project = projects.find((p) => p.id === projectId) || projects[0]
  const comps = components.filter((c) => c.projectId === project.id)
  const activeComps = comps.filter((c) => !c.archived)
  const feedback = feedbackAll.filter((f) => f.projectId === project.id)
  const fids = new Set(feedback.map((f) => f.id))
  const tasks = tasksAll.filter((t) => fids.has(t.fid))
  const receipts = receiptsAll.filter((r) => fids.has(r.fid))
  const questions = questionsAll.filter((q) => q.fids.some((id) => fids.has(id)))
  const submissions = submissionsAll.filter((s) => comps.some((c) => c.id === s.componentId))
  const events = eventsAll.filter((e) => e.projectId === project.id)

  const find = (id) => feedback.find((f) => f.id === id)
  const nameOf = (id) => members.find((m) => m.id === id)?.name || 'Unassigned'
  const compName = (id) => (id ? components.find((c) => c.id === id)?.name || '—' : 'Not sorted yet')
  const sources = [...new Set([...SOURCES, ...feedback.map((f) => f.source)])]

  function statusOf(f) {
    if (feedback.some((x) => x.relatesTo === f.id && x.relation === 'updates')) return 'Replaced'
    if (!f.componentId) return 'Needs sorting'
    if (questions.some((q) => q.fids.includes(f.id) && !q.resolved)) return 'Needs answer'
    const t = tasks.filter((x) => x.fid === f.id)
    const r = receipts.filter((x) => x.fid === f.id)
    if (t.length && t.every((x) => x.status === 'Done') && r.length) return 'Done'
    if (t.length || r.length) return 'In progress'
    return 'New'
  }

  const compOverdue = (c) => Boolean(c.deadline) && c.deadline < TODAY && !FINISHED.includes(c.status)
  const compFeedback = (id) => feedback.filter((f) => (id === UNSORTED ? !f.componentId : f.componentId === id))
  const compProgress = (c) => {
    const active = compFeedback(c.id).filter((f) => statusOf(f) !== 'Replaced')
    return active.length ? Math.round((100 * active.filter((f) => statusOf(f) === 'Done').length) / active.length) : null
  }

  const openQs = questions.filter((q) => !q.resolved)
  const openTasks = tasks.filter((t) => t.status !== 'Done')
  const myOpenTasks = openTasks.filter((t) => t.assigneeId === me.id)
  const overdueTasks = openTasks.filter((t) => t.deadline && t.deadline < TODAY)
  const overdueComps = activeComps.filter(compOverdue)
  const dueSoon = activeComps.filter((c) => c.deadline && c.status !== 'Approved' && daysUntil(c.deadline) >= 0 && daysUntil(c.deadline) <= 7)
  const unsortedFeedback = feedback.filter((f) => !f.componentId)
  const noTaskYet = feedback.filter((f) => statusOf(f) === 'New')
  const lastConsult = feedback.reduce((m, f) => (f.date > m ? f.date : m), '')

  const dueNote = (c) => {
    if (!c.deadline) return 'No deadline'
    const d = daysUntil(c.deadline)
    const over = compOverdue(c)
    return (
      <>
        Due {fmt(c.deadline)}
        {over && <span className="flag"> · Overdue</span>}
        {!over && c.status !== 'Approved' && d >= 0 && d <= 7 && <span className="flag"> · {d === 0 ? 'today' : `in ${plural(d, 'day')}`}</span>}
      </>
    )
  }

  /* ----- navigation ----- */
  function resetView() {
    setPage('overview'); setCompOpen(null); setSelectedId(null); setEditingComps(false)
    setFbFilter(FB0); setTaskFilter(TASK0); setCompFilter(COMP0)
  }
  function goTo(p) { setPage(p); setCompOpen(null); setSelectedId(null); setEditingComps(false) }
  function openComponent(id) { setPage('components'); setCompOpen(id); setSelectedId(null); setEditingComps(false) }
  function switchProject(id) { setProjectId(id); resetView() }
  function switchUser(id) { setMeId(id); setSelectedId(null); setEditingComps(false); setCapturing(false); setProjectModal(null) }

  /* ----- actions ----- */
  const log = (text, componentId = null) =>
    setEventsAll((c) => [{ id: newId(), projectId: project.id, componentId, date: TODAY, byId: meId, text }, ...c])
  const cidOf = (fid) => feedbackAll.find((f) => f.id === fid)?.componentId || null
  const refOf = (fid) => feedbackAll.find((f) => f.id === fid)?.ref || ''

  const act = {
    update: (id, patch) => setFeedbackAll((c) => c.map((f) => (f.id === id ? { ...f, ...patch } : f))),

    addTask: (fid, v) => {
      setTasksAll((c) => [...c, { id: newId(), fid, title: v.title.trim(), assigneeId: v.assigneeId || null, deadline: v.deadline || '', hours: v.hours || '', status: 'To do' }])
      log(`Task added for ${refOf(fid)}.`, cidOf(fid))
    },
    setTaskStatus: (id, status) => {
      const t = tasksAll.find((x) => x.id === id)
      if (!t || t.status === status) return
      setTasksAll((c) => c.map((x) => (x.id === id ? { ...x, status } : x)))
      log(`Task for ${refOf(t.fid)} moved to “${status}”.`, cidOf(t.fid))
    },
    assign: (id, assigneeId) => {
      const t = tasksAll.find((x) => x.id === id)
      if (!t) return
      setTasksAll((c) => c.map((x) => (x.id === id ? { ...x, assigneeId: assigneeId || null } : x)))
      log(`Task for ${refOf(t.fid)} assigned to ${nameOf(assigneeId)}.`, cidOf(t.fid))
    },
    setDeadline: (id, deadline) => setTasksAll((c) => c.map((x) => (x.id === id ? { ...x, deadline } : x))),

    addReceipt: (fid, v) => {
      setReceiptsAll((c) => [{ id: newId(), fid, date: TODAY, what: v.what.trim(), why: (v.why || '').trim(), byId: meId }, ...c])
      log(`Revision logged for ${refOf(fid)}.`, cidOf(fid))
    },
    addQuestion: (fid, text) => {
      setQuestionsAll((c) => [{ id: newId(), fids: [fid], kind: 'question', text: text.trim(), date: TODAY, resolved: false, answer: '' }, ...c])
      log(`Question raised for ${refOf(fid)}.`, cidOf(fid))
    },
    resolveQ: (id, answer) => {
      const q = questionsAll.find((x) => x.id === id)
      setQuestionsAll((c) => c.map((x) => (x.id === id ? { ...x, resolved: true, answer: answer.trim() } : x)))
      if (q) log(`Question resolved for ${refOf(q.fids[0])}.`, cidOf(q.fids[0]))
    },
    reopenQ: (id) => setQuestionsAll((c) => c.map((x) => (x.id === id ? { ...x, resolved: false } : x))),

    addComponent: (name) => setComponents((c) => [...c, { id: `c${newId()}`, projectId: project.id, name: name.trim(), deadline: '', status: 'Pending', archived: false }]),
    updateComponent: (id, patch) => setComponents((c) => c.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    toggleArchive: (id) => setComponents((c) => c.map((x) => (x.id === id ? { ...x, archived: !x.archived } : x))),
    removeComponent: (id) => setComponents((c) => c.filter((x) => x.id !== id)),
    moveComponent: (id, dir) => setComponents((c) => {
      const mine = c.filter((x) => x.projectId === project.id)
      const i = mine.findIndex((x) => x.id === id)
      const j = i + dir
      if (j < 0 || j >= mine.length) return c
      const a = mine[i]
      const b = mine[j]
      return c.map((x) => (x.id === a.id ? b : x.id === b.id ? a : x))
    }),
    setComponentStatus: (id, status) => {
      const comp = components.find((x) => x.id === id)
      if (!comp || comp.status === status) return
      setComponents((c) => c.map((x) => (x.id === id ? { ...x, status } : x)))
      log(`${comp.name}: ${comp.status} → ${status}.`, id)
    },
    addSubmission: (cid, v) => {
      const comp = components.find((x) => x.id === cid)
      const prev = submissionsAll.filter((s) => s.componentId === cid).length
      const label = prev === 0 ? 'Submission 1' : `Resubmission ${prev}`
      const next = prev === 0 ? 'Submitted' : 'Resubmitted'
      setSubmissionsAll((c) => [{ id: newId(), componentId: cid, date: TODAY, label, note: v.note.trim(), link: (v.link || '').trim(), byId: meId }, ...c])
      setComponents((c) => c.map((x) => (x.id === cid ? { ...x, status: next } : x)))
      log(`${label} recorded for ${comp.name}. Status: ${next}.`, cid)
    },

    saveProject: (d, mode) => {
      if (mode === 'edit') {
        setProjects((c) => c.map((p) => (p.id === project.id ? { ...p, name: d.name.trim(), description: d.description.trim() } : p)))
      } else {
        const id = `p${newId()}`
        setProjects((c) => [...c, { id, name: d.name.trim(), description: d.description.trim() }])
        if (d.template) {
          setComponents((c) => [...c, ...TEMPLATE.map((name, i) => ({ id: `c${newId()}${i}`, projectId: id, name, deadline: '', status: 'Pending', archived: false }))])
        }
        setProjectId(id)
        resetView()
      }
      setProjectModal(null)
    },

    setRole: (id, role) => {
      const m = members.find((x) => x.id === id)
      if (m.role === 'Leader' && role !== 'Leader' && leaderCount === 1) return
      setMembers((c) => c.map((x) => (x.id === id ? { ...x, role } : x)))
      if (role === 'Viewer') setTasksAll((c) => c.map((t) => (t.assigneeId === id ? { ...t, assigneeId: null } : t)))
    },
    removeMember: (id) => {
      setMembers((c) => c.map((x) => (x.id === id ? { ...x, removed: true } : x)))
      setTasksAll((c) => c.map((t) => (t.assigneeId === id ? { ...t, assigneeId: null } : t)))
    },
    simulateJoin: (name) => setMembers((c) => [...c, { id: `m${newId()}`, name: name.trim(), role: inviteRole, removed: false }]),
  }

  function saveFeedback(d) {
    const id = newId()
    const ref = `FDB-${String(feedback.length + 1).padStart(3, '0')}`
    const relatesTo = d.relatesTo ? Number(d.relatesTo) : null
    const relation = relatesTo ? d.relation : null
    const source = d.source.trim() || 'Unknown'
    const componentId = d.componentId || null

    setFeedbackAll((c) => [{ id, projectId: project.id, ref, componentId, source, comment: d.comment.trim(), date: d.date, recordedBy: meId, meaning: '', confirmed: false, doneWhen: '', link: '', relation, relatesTo }, ...c])
    log(`${ref} (${source}) recorded.`, componentId)

    if (relation === 'conflicts') {
      const e = find(relatesTo)
      setQuestionsAll((c) => [{ id: newId(), fids: [id, relatesTo], kind: 'conflict', text: `${ref} (${source}) contradicts ${e.ref} (${e.source}). Which should we follow?`, date: TODAY, resolved: false, answer: '' }, ...c])
    }
    setCapturing(false)
    setPage('components')
    setCompOpen(componentId || UNSORTED)
    setSelectedId(null)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`https://aura.app/join/${inviteToken}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  function resetDemo() {
    if (!window.confirm('Reset all data back to the demo? This cannot be undone.')) return
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('aura:')).forEach((k) => localStorage.removeItem(k))
    } catch {
      /* ignore */
    }
    window.location.reload()
  }

  const compIndex = (id) => {
    const i = comps.findIndex((c) => c.id === id)
    return i < 0 ? 999 : i
  }
  const reportRows = [...feedback].sort((a, b) => compIndex(a.componentId) - compIndex(b.componentId) || a.date.localeCompare(b.date))

  function downloadCsv() {
    const cell = (c) => {
      let s = String(c ?? '')
      if (/^[=+\-@]/.test(s)) s = `'${s}`
      return `"${s.replaceAll('"', '""')}"`
    }
    const rows = [['Ref', 'Component', 'Said by', 'Recorded by', 'Date', 'Instructor comment', 'Our reading', 'What we did', 'Why', 'Done by', 'Status'],
      ...reportRows.map((f) => {
        const r = receipts.filter((x) => x.fid === f.id)
        return [f.ref, compName(f.componentId), f.source, nameOf(f.recordedBy), f.date, f.comment, f.meaning,
          r.map((x) => x.what).join(' | '), r.map((x) => x.why).filter(Boolean).join(' | '),
          [...new Set(r.map((x) => nameOf(x.byId)))].join(', '), statusOf(f)]
      })]
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(cell).join(',')).join('\n')], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `aura-${project.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const ctx = { feedback, tasks, receipts, questions, comps, members, nameOf, compName, me, canEdit, canChangeTask }

  const row = (key, text, id) => (
    <button type="button" className="activity-item as-button" key={key} onClick={() => setSelectedId(id)}>
      <span>{text}</span><span className="text-button">Open →</span>
    </button>
  )

  function feedbackCard(f) {
    const s = statusOf(f)
    const nT = tasks.filter((t) => t.fid === f.id).length
    const nR = receipts.filter((r) => r.fid === f.id).length
    const nQ = questions.filter((x) => x.fids.includes(f.id) && !x.resolved).length
    return (
      <button type="button" key={f.id} className={`feedback-card card-button${s === 'Replaced' ? ' is-superseded' : ''}`} onClick={() => setSelectedId(f.id)}>
        <div className="feedback-card-content">
          <div className="feedback-card-heading">
            <span className="entry-label">{f.ref} · {fmt(f.date)} · {compName(f.componentId)}<span className="pill">{f.source}</span></span>
            <StatusBadge status={s} />
          </div>
          <p className="instructor-comment">“{f.comment}”</p>
          {f.meaning && <p className="read-line">We read it as: {f.meaning} {f.confirmed ? '✓ confirmed' : '(not confirmed yet)'}</p>}
          {f.relation && <p className="read-line">{f.relation === 'updates' ? '↰ Replaces' : '⚑ Contradicts'} {find(f.relatesTo)?.ref}</p>}
          <div className="entry-meta">
            <span>{plural(nT, 'task')}</span><span>·</span><span>{plural(nR, 'revision')}</span>
            {nQ > 0 && <><span>·</span><span className="flag">{plural(nQ, 'open question')}</span></>}
          </div>
        </div>
      </button>
    )
  }

  /* ================= pages ================= */

  function renderProgress() {
    const approved = activeComps.filter((c) => c.status === 'Approved').length
    const doneTasks = tasks.filter((t) => t.status === 'Done').length
    const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0)

    const stats = [
      { label: 'YOUR OPEN TASKS', n: myOpenTasks.length, hint: 'Assigned to you', go: () => { setTaskTab('Mine'); goTo('tasks') } },
      { label: 'OPEN QUESTIONS', n: openQs.length, hint: 'To ask next consultation', go: () => { setOverviewTab('Prep sheet'); setTimeout(() => document.getElementById('prep-questions')?.scrollIntoView({ behavior: 'smooth' }), 60) } },
      { label: 'OVERDUE TASKS', n: overdueTasks.length, hint: 'Past their deadline', warn: overdueTasks.length > 0, go: () => { setTaskTab('Everyone'); goTo('tasks') } },
      { label: 'NO TASK YET', n: noTaskYet.length, hint: 'Feedback with no action', go: () => { setFbFilter({ ...FB0, status: 'New' }); goTo('feedback') } },
    ]

    const attention = [
      ...overdueTasks.map((t) => ({ key: `t${t.id}`, text: `Overdue task: ${t.title} (${nameOf(t.assigneeId)})`, go: () => setSelectedId(t.fid) })),
      ...overdueComps.map((c) => ({ key: `c${c.id}`, text: `Past deadline: ${c.name} (${c.status})`, go: () => openComponent(c.id) })),
      ...dueSoon.map((c) => ({ key: `d${c.id}`, text: `Due soon: ${c.name} on ${fmt(c.deadline)}`, go: () => openComponent(c.id) })),
      ...openQs.filter((q) => q.kind === 'conflict').map((q) => ({ key: `q${q.id}`, text: `⚑ ${q.text}`, go: () => setSelectedId(q.fids[0]) })),
      ...unsortedFeedback.map((f) => ({ key: `u${f.id}`, text: `Needs a component: “${f.comment}”`, go: () => setSelectedId(f.id) })),
    ]

    return (
      <>
        <div className="stat-strip">
          {stats.map((s) => (
            <button type="button" key={s.label} className={`stat-card${s.warn ? ' warn' : ''}`} onClick={s.go}>
              <span className="summary-label">{s.label}</span>
              <strong>{s.n}</strong>
              <span className="helper">{s.hint}</span>
            </button>
          ))}
        </div>

        <section className="page-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">PROJECT PROGRESS</span>
              <h2>{project.name}</h2>
              {project.description && <p className="section-description">{project.description}</p>}
            </div>
            {isLeader && <button type="button" className="secondary-button" onClick={() => setProjectModal('edit')}>Edit project</button>}
          </div>
          <div className="progress-pair">
            <div>
              <span className="helper">Components approved · {approved} of {activeComps.length}</span>
              <Bar pct={pct(approved, activeComps.length)} />
            </div>
            <div>
              <span className="helper">Revision tasks done · {doneTasks} of {tasks.length}</span>
              <Bar pct={pct(doneTasks, tasks.length)} />
            </div>
          </div>
        </section>

        <Block eyebrow="COMPONENT STATUS" title={`Your ${plural(activeComps.length, 'component')}`}
          rows={activeComps.map((c) => {
            const p = compProgress(c)
            return (
              <button type="button" className="activity-item as-button" key={c.id} onClick={() => openComponent(c.id)}>
                <span className="comp-line"><strong>{c.name}</strong><StatusBadge status={c.status} /></span>
                <span className="helper">{dueNote(c)}{p !== null && ` · ${p}% of feedback done`}</span>
              </button>
            )
          })} />

        <Block eyebrow="NEEDS YOUR ATTENTION" title={attention.length ? `${plural(attention.length, 'thing')} to look at` : 'You’re all caught up'}
          rows={attention.map((a) => (
            <button type="button" className="activity-item as-button" key={a.key} onClick={a.go}>
              <span>{a.text}</span><span className="text-button">Open →</span>
            </button>
          ))} />

        <Block eyebrow="RECENT ACTIVITY" title="What happened lately"
          rows={events.slice(0, 6).map((e) => (
            <div className="activity-item" key={e.id}>
              <span>{e.text}</span><span className="helper">{fmt(e.date)} · {nameOf(e.byId)}</span>
            </div>
          ))} />
      </>
    )
  }

  function renderPrep() {
    const toConfirm = feedback.filter((f) => f.meaning && !f.confirmed && statusOf(f) !== 'Replaced')
    const noFinish = feedback.filter((f) => f.componentId && !f.doneWhen && !['Replaced', 'Done'].includes(statusOf(f)))
    const changed = receipts.filter((r) => r.date > lastConsult)

    return (
      <>
        <div className="prep-header">
          <div>
            <span className="section-eyebrow">PREP SHEET</span>
            <h2>For your next consultation</h2>
            <span className="helper">Last consultation recorded: {lastConsult ? fmt(lastConsult) : 'none yet'}</span>
          </div>
          <button type="button" className="secondary-button no-print" onClick={() => window.print()}>Print / save as PDF</button>
        </div>

        <Block eyebrow="ASSIGNED TO YOU" title={`Your open tasks (${myOpenTasks.length})`}
          rows={myOpenTasks.map((t) => row(`m${t.id}`, `${t.title} · Due ${fmt(t.deadline)}${t.deadline && t.deadline < TODAY ? ' · Overdue' : ''}`, t.fid))} />
        <Block id="prep-questions" eyebrow="BRING THESE UP" title={`Questions to ask (${openQs.length})`}
          rows={[...openQs].sort((a, b) => (b.kind === 'conflict') - (a.kind === 'conflict')).map((q) => row(q.id, `${q.kind === 'conflict' ? '⚑ ' : ''}${q.text}`, q.fids[0]))} />
        <Block eyebrow="CHECK YOUR UNDERSTANDING" title={`Readings to confirm (${toConfirm.length})`}
          rows={toConfirm.map((f) => row(f.id, `${f.ref}: “${f.comment}” → we think: ${f.meaning}`, f.id))} />
        <Block eyebrow="NO FINISH LINE YET" title={`Ask what “done” looks like (${noFinish.length})`}
          rows={noFinish.map((f) => row(f.id, `${f.ref}: “${f.comment}”`, f.id))} />
        <Block eyebrow="NOT CONNECTED TO ANY TASK" title={`Feedback with no task yet (${noTaskYet.length})`}
          rows={noTaskYet.map((f) => row(f.id, `${f.ref} · ${compName(f.componentId)}: “${f.comment}”`, f.id))} />
        <Block eyebrow="SHOW THEM" title={`Changed since last consultation (${changed.length})`}
          rows={changed.map((r) => row(r.id, `${find(r.fid)?.ref}: ${r.what}${r.why ? ` (why: ${r.why})` : ''}`, r.fid))} />
      </>
    )
  }

  function renderOverview() {
    return (
      <>
        <div className="filter-list no-print">
          {['Progress', 'Prep sheet'].map((t) => (
            <button key={t} type="button" className={overviewTab === t ? 'filter-chip selected' : 'filter-chip'} onClick={() => setOverviewTab(t)}>{t}</button>
          ))}
        </div>
        {overviewTab === 'Progress' ? renderProgress() : renderPrep()}
      </>
    )
  }

  function renderComponentView() {
    const comp = components.find((c) => c.id === compOpen)
    const thread = compFeedback(compOpen).sort((a, b) => a.date.localeCompare(b.date))
    const current = thread.filter((f) => statusOf(f) !== 'Replaced').at(-1)
    const contested = openQs.some((q) => q.kind === 'conflict' && q.fids.some((id) => thread.some((f) => f.id === id)))
    const subs = comp ? submissions.filter((s) => s.componentId === comp.id) : []
    const timeline = events.filter((e) => e.componentId === compOpen)

    return (
      <section className="page-section">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">{comp?.archived ? 'ARCHIVED COMPONENT' : 'COMPONENT'}</span>
            <h2>{comp ? comp.name : 'Not sorted yet'}</h2>
          </div>
          <button type="button" className="secondary-button" onClick={() => setCompOpen(null)}>← All components</button>
        </div>

        {comp && (
          <div className="comp-meta">
            <label>Status
              <select disabled={!canEdit} value={comp.status} onChange={(e) => act.setComponentStatus(comp.id, e.target.value)}>
                {COMPONENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>Deadline
              <input type="date" disabled={!isLeader} title={isLeader ? '' : 'Only the Leader can change deadlines'} value={comp.deadline || ''} onChange={(e) => act.updateComponent(comp.id, { deadline: e.target.value })} />
            </label>
            <span className="helper">{dueNote(comp)}</span>
          </div>
        )}

        {current && (
          <div className="next-action-panel">
            <div className="next-action-symbol">{contested ? '⚑' : '✓'}</div>
            <div className="next-action-copy">
              <span className="panel-eyebrow">{contested ? 'CONTESTED: ASK YOUR INSTRUCTORS' : 'INSTRUCTION THAT APPLIES NOW'}</span>
              <h3>“{current.comment}”</h3>
              <p>{current.source} · {fmt(current.date)}</p>
            </div>
          </div>
        )}

        {comp && (
          <div className="modal-section">
            <h3>Submissions ({subs.length})</h3>
            {subs.map((s) => (
              <div className="mini-row" key={s.id}>
                <div>
                  <strong>{s.label}{s.note && ` — ${s.note}`}</strong>
                  <span className="mini-meta">{nameOf(s.byId)} · {fmt(s.date)}</span>
                </div>
                {safeUrl(s.link) && <a className="ext-link" href={s.link} target="_blank" rel="noreferrer">Open ↗</a>}
              </div>
            ))}
            {canEdit && (
              <AddRow label="Record submission" onAdd={(v) => act.addSubmission(comp.id, v)} fields={[
                { key: 'note', ph: 'What did you submit? e.g. Draft 2', grow: true },
                { key: 'link', ph: 'Link (optional)' },
              ]} />
            )}
          </div>
        )}

        <div className="modal-section">
          <h3>Feedback story, oldest first ({thread.length})</h3>
          {thread.length === 0
            ? <p className="helper">No feedback yet. Use “+ Quick capture” at the top right.</p>
            : <div className="feedback-list">{thread.map(feedbackCard)}</div>}
        </div>

        {comp && (
          <div className="modal-section">
            <h3>Timeline</h3>
            {timeline.length === 0
              ? <p className="helper">Nothing has happened here yet.</p>
              : (
                <div className="timeline">
                  {timeline.map((e) => (
                    <div className="timeline-item" key={e.id}>
                      {e.text}
                      <span className="helper">{fmt(e.date)} · {nameOf(e.byId)}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </section>
    )
  }

  function renderComponents() {
    if (compOpen) return renderComponentView()

    const cq = compFilter.q.toLowerCase()
    const ordered = [...comps.filter((c) => !c.archived), ...comps.filter((c) => c.archived)]
    const visible = ordered.filter((c) => (compFilter.status === 'All' || c.status === compFilter.status) && c.name.toLowerCase().includes(cq))
    const showUnsorted = compFilter.status === 'All' && !cq && unsortedFeedback.length > 0

    const card = (id, name, c) => {
      const all = compFeedback(id)
      const active = all.filter((f) => statusOf(f) !== 'Replaced')
      const conflict = openQs.some((q) => q.kind === 'conflict' && q.fids.some((fid) => all.some((f) => f.id === fid)))
      return (
        <button type="button" className={`summary-card${c?.archived ? ' is-archived' : ''}`} key={id} onClick={() => setCompOpen(id)}>
          <div className="summary-card-top"><span className="summary-label">{name.toUpperCase()}{c?.archived ? ' · ARCHIVED' : ''}</span></div>
          {c && <StatusBadge status={c.status} />}
          <strong>{active.length}</strong>
          <p>active {active.length === 1 ? 'comment' : 'comments'}{conflict && <span className="flag"> · ⚑ conflict</span>}</p>
          {c && <p>{dueNote(c)}</p>}
          <span className="summary-link">Open →</span>
        </button>
      )
    }

    return (
      <>
        <div className="filter-bar">
          <Search label="Search components…" value={compFilter.q} onChange={(q) => setCompFilter({ ...compFilter, q })} />
          <Pick label="Filter by status" value={compFilter.status} onChange={(status) => setCompFilter({ ...compFilter, status })}
            options={[{ id: 'All', name: 'All statuses' }, ...COMPONENT_STATUSES.map((s) => ({ id: s, name: s }))]} />
          {isLeader && !editingComps && <button type="button" className="secondary-button" onClick={() => setEditingComps(true)}>Edit components</button>}
        </div>

        {isLeader && editingComps && (
          <section className="page-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">LEADER ONLY</span>
                <h2>Edit components</h2>
                <p className="section-description">Components with feedback or submissions are archived, not deleted, so history is never lost.</p>
              </div>
              <button type="button" className="primary-button" onClick={() => setEditingComps(false)}>Done editing</button>
            </div>
            {comps.map((c, i) => {
              const count = feedbackAll.filter((f) => f.componentId === c.id).length + submissionsAll.filter((s) => s.componentId === c.id).length
              return (
                <div className="section-edit-row" key={c.id}>
                  <input aria-label="Component name" value={c.name} placeholder="Component name" onChange={(e) => act.updateComponent(c.id, { name: e.target.value })} />
                  <input type="date" aria-label="Deadline" value={c.deadline || ''} onChange={(e) => act.updateComponent(c.id, { deadline: e.target.value })} />
                  <span className="helper">{plural(count, 'record')}{c.archived ? ' · archived' : ''}</span>
                  <button type="button" className="secondary-button" aria-label="Move up" disabled={i === 0} onClick={() => act.moveComponent(c.id, -1)}>↑</button>
                  <button type="button" className="secondary-button" aria-label="Move down" disabled={i === comps.length - 1} onClick={() => act.moveComponent(c.id, 1)}>↓</button>
                  {count === 0
                    ? <button type="button" className="secondary-button" onClick={() => act.removeComponent(c.id)}>Remove</button>
                    : <button type="button" className="secondary-button" onClick={() => act.toggleArchive(c.id)}>{c.archived ? 'Restore' : 'Archive'}</button>}
                </div>
              )
            })}
            <AddRow onAdd={(v) => act.addComponent(v.name)} fields={[{ key: 'name', ph: 'New component name…', grow: true }]} />
          </section>
        )}

        {visible.length === 0 && !showUnsorted ? (
          <div className="empty-state"><h3>No components match</h3><p>Try a different search or status.</p></div>
        ) : (
          <section className="summary-grid">
            {visible.map((c) => card(c.id, c.name || 'Untitled', c))}
            {showUnsorted && card(UNSORTED, 'Not sorted yet', null)}
          </section>
        )}
      </>
    )
  }

  function renderFeedback() {
    const q = fbFilter.q.toLowerCase()
    const items = feedback
      .filter((f) => {
        const s = statusOf(f)
        return (fbFilter.status === 'All' || s === fbFilter.status)
          && (fbFilter.comp === 'All' || (fbFilter.comp === UNSORTED ? !f.componentId : f.componentId === fbFilter.comp))
          && (!fbFilter.from || f.date >= fbFilter.from)
          && (!fbFilter.to || f.date <= fbFilter.to)
          && [f.ref, f.comment, f.source, f.meaning, compName(f.componentId), s].some((v) => String(v || '').toLowerCase().includes(q))
      })
      .sort((a, b) => b.date.localeCompare(a.date))
    const filtered = JSON.stringify(fbFilter) !== JSON.stringify(FB0)

    return (
      <section className="page-section">
        <div className="filter-bar">
          <Search label="Search feedback…" value={fbFilter.q} onChange={(v) => setFbFilter({ ...fbFilter, q: v })} />
          <Pick label="Filter by status" value={fbFilter.status} onChange={(v) => setFbFilter({ ...fbFilter, status: v })}
            options={[{ id: 'All', name: 'All statuses' }, ...FEEDBACK_STATUSES.map((s) => ({ id: s, name: s === 'New' ? 'New (no task yet)' : s }))]} />
          <Pick label="Filter by component" value={fbFilter.comp} onChange={(v) => setFbFilter({ ...fbFilter, comp: v })}
            options={[{ id: 'All', name: 'All components' }, ...comps.map((c) => ({ id: c.id, name: c.name })), { id: UNSORTED, name: 'Not sorted yet' }]} />
          <label className="date-filter">From <input type="date" value={fbFilter.from} onChange={(e) => setFbFilter({ ...fbFilter, from: e.target.value })} /></label>
          <label className="date-filter">To <input type="date" value={fbFilter.to} onChange={(e) => setFbFilter({ ...fbFilter, to: e.target.value })} /></label>
          {filtered && <button type="button" className="text-button" onClick={() => setFbFilter(FB0)}>Clear filters</button>}
        </div>
        <p className="helper tab-note">{plural(items.length, 'comment')} found</p>

        {items.length === 0 ? (
          <div className="empty-state">
            <h3>{feedback.length === 0 ? 'No feedback yet' : 'Nothing matches'}</h3>
            <p>{feedback.length === 0 ? 'Click “+ Quick capture” at the top right after your next consultation.' : 'Try a different search or filter.'}</p>
          </div>
        ) : (
          <div className="feedback-list">{items.map(feedbackCard)}</div>
        )}
      </section>
    )
  }

  function renderTasks() {
    const tq = taskFilter.q.toLowerCase()
    const base = taskTab === 'Mine' ? tasks.filter((t) => t.assigneeId === me.id) : tasks
    const list = base
      .filter((t) => {
        const f = find(t.fid)
        return (taskFilter.status === 'All' || t.status === taskFilter.status)
          && (taskFilter.who === 'All' || (taskFilter.who === 'none' ? !t.assigneeId : t.assigneeId === taskFilter.who))
          && (taskFilter.comp === 'All' || f?.componentId === taskFilter.comp)
          && [t.title, nameOf(t.assigneeId), f?.ref, compName(f?.componentId)].some((v) => String(v || '').toLowerCase().includes(tq))
      })
      .sort((a, b) => ((a.status === 'Done') - (b.status === 'Done')) || (a.deadline || '9999').localeCompare(b.deadline || '9999'))
    const mineCount = tasks.filter((t) => t.assigneeId === me.id).length
    const filtered = JSON.stringify(taskFilter) !== JSON.stringify(TASK0)

    return (
      <section className="page-section">
        <div className="filter-list">
          <button type="button" className={taskTab === 'Mine' ? 'filter-chip selected' : 'filter-chip'} onClick={() => setTaskTab('Mine')}>Mine ({mineCount})</button>
          <button type="button" className={taskTab === 'Everyone' ? 'filter-chip selected' : 'filter-chip'} onClick={() => setTaskTab('Everyone')}>Everyone ({tasks.length})</button>
        </div>

        <div className="filter-bar">
          <Search label="Search tasks…" value={taskFilter.q} onChange={(v) => setTaskFilter({ ...taskFilter, q: v })} />
          <Pick label="Filter by status" value={taskFilter.status} onChange={(v) => setTaskFilter({ ...taskFilter, status: v })}
            options={[{ id: 'All', name: 'All statuses' }, ...TASK_STATUSES.map((s) => ({ id: s, name: s }))]} />
          {taskTab === 'Everyone' && (
            <Pick label="Filter by member" value={taskFilter.who} onChange={(v) => setTaskFilter({ ...taskFilter, who: v })}
              options={[{ id: 'All', name: 'All members' }, { id: 'none', name: 'Unassigned' }, ...activeMembers.filter((m) => m.role !== 'Viewer').map((m) => ({ id: m.id, name: m.name }))]} />
          )}
          <Pick label="Filter by component" value={taskFilter.comp} onChange={(v) => setTaskFilter({ ...taskFilter, comp: v })}
            options={[{ id: 'All', name: 'All components' }, ...comps.map((c) => ({ id: c.id, name: c.name }))]} />
          {filtered && <button type="button" className="text-button" onClick={() => setTaskFilter(TASK0)}>Clear filters</button>}
        </div>
        {taskTab === 'Everyone' && <p className="helper tab-note">You can change only your own tasks{isLeader ? ', and as Leader, anyone’s' : ''}.</p>}

        {list.length === 0 ? (
          <div className="empty-state">
            <h3>{taskTab === 'Mine' && !filtered ? 'Nothing assigned to you' : 'No tasks to show'}</h3>
            <p>{me.role === 'Viewer' ? 'Viewers can read tasks but are not assigned any.' : 'Tasks are added inside a feedback card. Unassigned ones appear under Everyone, where you can claim them.'}</p>
            <button type="button" className="secondary-button" onClick={() => goTo('feedback')}>Go to Feedback</button>
          </div>
        ) : (
          <div className="task-list">
            {list.map((t) => (
              <article className="task-row" key={t.id}>
                <div className="task-main">
                  <span className="entry-label">{find(t.fid)?.ref} · {compName(find(t.fid)?.componentId)}</span>
                  <h3>{t.title}</h3>
                  <span className="task-assignee">
                    {t.assigneeId ? nameOf(t.assigneeId) : <span className="pill unassigned">Unassigned</span>}{t.hours && ` · ${t.hours}h`}
                    {t.deadline && t.deadline < TODAY && t.status !== 'Done' && <span className="flag"> · Overdue</span>}
                  </span>
                </div>
                <div className="task-controls">
                  <TaskControls t={t} ctx={ctx} act={act} />
                  <button type="button" className="text-button" onClick={() => setSelectedId(t.fid)}>Feedback →</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }

  function renderReport() {
    return (
      <section className="page-section">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">READY FOR YOUR DEFENSE</span>
            <h2>{plural(feedback.length, 'comment')} in {project.name}</h2>
          </div>
          <button type="button" className="primary-button" onClick={downloadCsv}>Download CSV</button>
        </div>
        <div className="activity-table-wrap">
          <table className="activity-table">
            <thead><tr><th>Component</th><th>Said by</th><th>Comment</th><th>What we did</th><th>Why</th><th>Done by</th><th>Status</th></tr></thead>
            <tbody>
              {reportRows.map((f) => {
                const r = receipts.filter((x) => x.fid === f.id)
                return (
                  <tr key={f.id}>
                    <td>{compName(f.componentId)}</td>
                    <td>{f.source}<p>{fmt(f.date)}</p></td>
                    <td className="feedback-details-cell">{f.comment}</td>
                    <td className="feedback-details-cell">{r.map((x) => x.what).join(' · ') || '—'}</td>
                    <td className="feedback-details-cell">{r.map((x) => x.why).filter(Boolean).join(' · ') || '—'}</td>
                    <td>{[...new Set(r.map((x) => nameOf(x.byId)))].join(', ') || '—'}</td>
                    <td><StatusBadge status={statusOf(f)} /></td>
                  </tr>
                )
              })}
              {reportRows.length === 0 && <tr><td colSpan="7" className="table-empty">No feedback recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  function renderMembers() {
    return (
      <>
        <section className="page-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">INVITE YOUR GROUP</span>
              <h2>Share a link</h2>
              <p className="section-description">Anyone with the link joins with the role you pick. Regenerate the link to cancel the old one. Members are shared by every project in your group.</p>
            </div>
          </div>
          {isLeader ? (
            <>
              <div className="invite-box">
                <input readOnly aria-label="Invite link" value={`https://aura.app/join/${inviteToken}`} />
                <select aria-label="Role for people who join" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  {['Member', 'Viewer'].map((r) => <option key={r}>{r}</option>)}
                </select>
                <button type="button" className="primary-button" onClick={copyLink}>{copied ? 'Copied ✓' : 'Copy link'}</button>
                <button type="button" className="secondary-button" onClick={() => setInviteToken(newToken())}>Regenerate</button>
              </div>
              <p className="helper demo-note">Demo only: this prototype can’t send real invites. Simulate someone joining with the role chosen above:</p>
              <AddRow onAdd={(v) => act.simulateJoin(v.name)} fields={[{ key: 'name', ph: 'New member’s name', grow: true }]} />
            </>
          ) : (
            <p className="helper">Only the Leader can invite people. Ask your Leader for the link.</p>
          )}
        </section>

        <section className="page-section">
          <div className="section-heading">
            <div><span className="section-eyebrow">WHO’S IN</span><h2>{plural(activeMembers.length, 'member')}</h2></div>
          </div>
          {activeMembers.map((m) => {
            const count = openTasks.filter((t) => t.assigneeId === m.id).length
            const lastLeader = m.role === 'Leader' && leaderCount === 1
            return (
              <div className="mini-row" key={m.id}>
                <div>
                  <strong>{m.name}{m.id === meId && ' (you)'}</strong>
                  <span className="mini-meta">{plural(count, 'open task')} in this project</span>
                </div>
                <div className="inline-row">
                  {isLeader ? (
                    <select aria-label={`Role for ${m.name}`} value={m.role} disabled={lastLeader} title={lastLeader ? 'A group needs at least one Leader' : ''} onChange={(e) => act.setRole(m.id, e.target.value)}>
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  ) : (
                    <span className="pill">{m.role}</span>
                  )}
                  {isLeader && m.id !== meId && <button type="button" className="secondary-button" onClick={() => act.removeMember(m.id)}>Remove</button>}
                </div>
              </div>
            )
          })}
        </section>

        <section className="page-section">
          <div className="section-heading">
            <div><span className="section-eyebrow">WHAT EACH ROLE CAN DO</span><h2>Roles</h2></div>
          </div>
          <div className="activity-table-wrap">
            <table className="activity-table roles-table">
              <thead><tr><th></th><th>Leader</th><th>Member</th><th>Viewer</th></tr></thead>
              <tbody>
                <tr><td>Read everything</td><td>✓</td><td>✓</td><td>✓</td></tr>
                <tr><td>Capture feedback, log revisions, add questions</td><td>✓</td><td>✓</td><td>—</td></tr>
                <tr><td>Record submissions and change component status</td><td>✓</td><td>✓</td><td>—</td></tr>
                <tr><td>Create tasks and claim unassigned ones</td><td>✓</td><td>✓</td><td>—</td></tr>
                <tr><td>Change a task’s status or deadline</td><td>Any task</td><td>Own tasks</td><td>—</td></tr>
                <tr><td>Reassign tasks</td><td>✓</td><td>—</td><td>—</td></tr>
                <tr><td>Create projects, edit components and deadlines, manage members</td><td>✓</td><td>—</td><td>—</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {isLeader && (
          <section className="page-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">DEMO TOOLS</span>
                <h2>Saved in this browser</h2>
                <p className="section-description">Your data is remembered between visits on this device only. Reset to start over with the demo data.</p>
              </div>
              <button type="button" className="secondary-button" onClick={resetDemo}>Reset demo data</button>
            </div>
          </section>
        )}
      </>
    )
  }

  const body = { overview: renderOverview, components: renderComponents, feedback: renderFeedback, tasks: renderTasks, report: renderReport, members: renderMembers }[page]()
  const navCounts = { components: activeComps.length, feedback: feedback.length, tasks: myOpenTasks.length, members: activeMembers.length }
  const selectedItem = selectedId ? find(selectedId) : null
  const info = pageInfo[page]

  return (
    <div className={darkMode ? 'dashboard dark-mode' : 'dashboard'}>
      <datalist id="sources">{sources.map((s) => <option key={s} value={s} />)}</datalist>

      <aside className="sidebar">
        <button type="button" className="brand" onClick={() => goTo('overview')} aria-label="Go to AURA overview">
          <span className="brand-mark">a.</span>
          <span className="brand-name">AURA<span>Academic Updates, Revisions, and Actions</span></span>
        </button>

        <div className="project-switch">
          <span className="sidebar-section-label">PROJECT</span>
          <select aria-label="Project" value={project.id} onChange={(e) => switchProject(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {isLeader && <button type="button" className="text-button" onClick={() => setProjectModal('new')}>+ New project</button>}
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {pages.map((p) => (
            <button key={p.id} type="button" className={page === p.id ? 'nav-link active' : 'nav-link'} onClick={() => goTo(p.id)}>
              <span className="nav-icon">{p.icon}</span>
              <span className="nav-label">{p.label}</span>
              {navCounts[p.id] > 0 && <span className="nav-count">{navCounts[p.id]}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">{me.name[0]}</div>
          <div className="profile-info"><strong>{me.name}</strong><span>{me.role}</span></div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div className="breadcrumb">{project.name} <span>/</span> {info.title}</div>
          <div className="topbar-actions">
            <label className="demo-switch">
              <span>Viewing as</span>
              <select aria-label="Viewing as" value={me.id} onChange={(e) => switchUser(e.target.value)}>
                {activeMembers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
              </select>
            </label>
            <button type="button" className="theme-toggle" onClick={() => setDarkMode((c) => !c)} aria-label="Toggle dark mode">
              <span>{darkMode ? '☀' : '☾'}</span>
            </button>
            <button type="button" className="primary-button" disabled={!canEdit} title={canEdit ? '' : 'Viewers cannot add feedback'} onClick={() => setCapturing(true)}>+ Quick capture</button>
          </div>
        </header>

        <div className="page-content">
          <section className="page-title">
            <div>
              <span className="page-eyebrow">{info.eyebrow}</span>
              <h1>{info.title}<span>.</span></h1>
              <p>{info.description}</p>
            </div>
          </section>
          {body}
          <footer className="dashboard-footer">
            <span className="footer-brand">aura.</span>
            <span>Keep Track of Feedback. Know What to Do Next.</span>
          </footer>
        </div>
      </main>

      {capturing && canEdit && <Capture feedback={feedback} comps={comps} onSave={saveFeedback} onClose={() => setCapturing(false)} />}
      {projectModal && isLeader && <ProjectModal mode={projectModal} project={project} onSave={(d) => act.saveProject(d, projectModal)} onClose={() => setProjectModal(null)} />}
      {selectedItem && <Detail item={selectedItem} status={statusOf(selectedItem)} ctx={ctx} act={act} onClose={() => setSelectedId(null)} onOpen={setSelectedId} />}
    </div>
  )
}

export default Dashboard