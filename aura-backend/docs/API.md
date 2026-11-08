# AURA backend API

Base URL: `http://localhost:8080`. All bodies are JSON. Dates are `yyyy-MM-dd`.
Errors always look like `{ "error": "message" }` (validation errors add a `fields` map).

## Identifying the caller (read this first)

Every `/api/projects/**` call needs the header `X-User-Id: <id>`, where `id` is the value returned by
`POST /api/auth/login`. Only members of a project can see or change it; everyone else gets `404`.

> **This is not real authentication.** Anyone who knows a user id can send that header. It gives the
> project-membership rules a place to live, but before this goes anywhere public, replace it with
> signed sessions/JWT (Spring Security) and hash passwords with BCrypt (they are stored in plain text today).

| Status | Meaning |
|---|---|
| 400 | Validation failed or the request breaks a rule (message says which) |
| 401 | Missing/unknown `X-User-Id` |
| 403 | Only the project owner may do this (delete project) |
| 404 | Not found, or you are not a member of that project |

## Nothing is deleted

Requirement 4 says history must never be lost, so:

* `DELETE` on a project, component or task **archives** it. It disappears from lists, but its feedback, tasks and history rows stay in the database.
* Feedback **cannot be edited or deleted**. When instructions change, call `/revise`: the old record becomes `Superseded` and a new version is created.
* The history log is **append-only** (no update/delete endpoint, columns are `updatable=false`).
* Removing a group member deactivates them; their name stays on old tasks.

## Enums

Accepted case-insensitively, as label or constant name (`"Under Review"`, `UNDER_REVIEW`, `under-review`). Returned as labels.

* Component/project status: `Pending, Submitted, Under Review, For Revision, Resubmitted, Approved`
* Task status: `To Do, In Progress, Needs Clarification, Done`
* Feedback status: `Open, Resolved, Superseded` (Superseded is set only by `/revise`)
* Feedback type: `Feedback, Clarification`
* Component type: `Chapter, Proposal, Documentation, Prototype, Presentation, Other`

## Endpoints

### Projects (Requirement 1)
| Method | Path | Notes |
|---|---|---|
| POST | `/api/projects` | `{title*, type, adviser (or professor), semester, subjectSection, deadline, status, description, members:[names]}`. Caller becomes owner + "Team Leader" |
| GET | `/api/projects` | Projects the caller belongs to, with `progress`, `openTaskCount`, `unresolvedFeedbackCount` |
| GET / PUT | `/api/projects/{id}` | PUT changes are logged in history |
| DELETE | `/api/projects/{id}` | Owner only; archives |
| GET | `/api/projects/{id}/overview?days=14` | Requirement 5, see below |

### Group members (Group collaboration)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/projects/{id}/members` | |
| POST | `/api/projects/{id}/members` | `{name, email, role}`. If `email` matches a registered account the member is linked and gets access; otherwise it is just a name tasks can be assigned to |
| PUT / DELETE | `/api/projects/{id}/members/{mid}` | Cannot remove someone with unfinished tasks, or the last account holder |

### Components (Requirement 1)
| Method | Path | Notes |
|---|---|---|
| POST | `/api/projects/{id}/components` | `{name*, dueDate* (or due), type, description, progress, ownerId, status}` |
| GET | `/api/projects/{id}/components` | Filters: `status, dueFrom, dueTo, ownerId, q` |
| GET / PUT | `/api/projects/{id}/components/{cid}` | |
| PATCH | `/api/projects/{id}/components/{cid}/status` | `{status*, note}`; logged with old and new value. `Approved` sets progress to 100 |
| DELETE | `/api/projects/{id}/components/{cid}` | Archives |

### Feedback (Requirements 2 and 3)
| Method | Path | Notes |
|---|---|---|
| POST | `/api/projects/{id}/feedback` | `{componentId*, text*, type, givenBy, receivedOn}`. `givenBy` defaults to the adviser (or you, for a clarification) |
| GET | `/api/projects/{id}/feedback` | Filters: `componentId, status, type, from, to, q, includeSuperseded`. Superseded versions are hidden unless requested. Each item includes its `replies` |
| GET | `/api/projects/{id}/feedback/{fid}` | Detail: linked `tasks`, `replies`, full `versions` chain |
| POST | `/api/projects/{id}/feedback/{fid}/revise` | `{text*, reason, givenBy, receivedOn}`. Old version kept as Superseded; new version returned |
| PATCH | `/api/projects/{id}/feedback/{fid}/status` | `{status: Open \| Resolved}` |
| POST | `/api/projects/{id}/feedback/{fid}/replies` | `{text*}`, e.g. the answer to a clarification |

### Revision tasks (Requirement 3)
| Method | Path | Notes |
|---|---|---|
| POST | `/api/projects/{id}/feedback/{fid}/tasks` | Turn feedback into a linked task: `{title*, assigneeId, dueDate, description}`. Call it several times for several tasks |
| GET | `/api/projects/{id}/feedback/{fid}/tasks` | |
| POST | `/api/projects/{id}/tasks` | Same body plus `feedbackId`, or `componentId` for a general task |
| GET | `/api/projects/{id}/tasks` | Filters: `status, assigneeId, mine=true, componentId, feedbackId, dueFrom, dueTo, overdue=true, q` |
| GET / PUT | `/api/projects/{id}/tasks/{tid}` | PUT edits title, description, assignee, due date |
| PATCH | `/api/projects/{id}/tasks/{tid}/status` | `{status*}` |
| DELETE | `/api/projects/{id}/tasks/{tid}` | Archives |

Tasks cannot be attached to a superseded feedback version; link them to the latest one.

### Revision history (Requirement 4)
| Method | Path | Notes |
|---|---|---|
| POST | `/api/projects/{id}/revisions` | Document a change made in response to feedback: `{summary*, feedbackId, taskId, componentId}` (at least one id; the rest are filled in) |
| GET | `/api/projects/{id}/history` | Newest first. Filters: `type, componentId, feedbackId, taskId, from, to, q`. Types: Project, Component, Status Change, Feedback, Task, Revision, Member |

Feedback, tasks, status changes and member changes are logged automatically.

### Overview (Requirement 5)
`GET /api/projects/{id}/overview?days=14` returns `overallProgress`, `componentStatusCounts` (all six statuses),
`overdueComponentCount`, `overdueTaskCount`, `components`, `outstandingTasks` (not Done, soonest first),
`unresolvedFeedback` (Open only) and `upcomingDeadlines` (unfinished components and tasks due within
`days`, plus anything already overdue).

## Requirement coverage

| Requirement | Status |
|---|---|
| Must 1 Project management | Done |
| Must 2 Feedback management + versioning | Done |
| Must 3 Feedback-to-task linking | Done |
| Must 4 Revision history | Done |
| Must 5 Project overview | Done |
| Should: group collaboration, search/filter, clarification (feedback `type=Clarification` + replies), component statuses | Done (basic) |
| Should: submission records, notifications | Not yet (overview already lists deadlines and overdue items) |
| Nice-to-have | Not yet |

## Running

```
cd aura-backend
./mvnw spring-boot:run      # needs MySQL as configured in application.properties
./mvnw test                 # uses in-memory H2, no MySQL needed
```
Hibernate (`ddl-auto=update`) creates the new tables and adds the new columns to `projects` on first start.
Existing project rows have no members, so they will not show up for anyone.
