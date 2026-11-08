# AURA – Academic Updates, Revisions, and Actions (front end)

Keep Track of Feedback. Know What to Do Next.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # UI tests: every route, forms, auth, persistence, and the server-backed flows
npm run build
```

## Backend or no backend

The dashboard has two data modes, chosen by the account you sign in with. See `.env.example` for the URLs.

- **Server mode** (account created on the Spring Boot backend, so its id is numeric). Projects, components,
  feedback, tasks, members and revision history are stored on the server through `src/services/projectApi.js`;
  every request carries the user's id in `X-User-Id`. State lives in `src/context/RemoteProjectProvider.jsx`.
  Failed requests show a banner with the server's message and a Retry button.
- **Offline mode** (the demo account `demo@aura.edu.ph` / `demo1234`, or any account created while the server
  was down). Everything is saved per user in `localStorage` by `src/context/ProjectContext.jsx`.

Both providers expose the same `useProject()` value, so pages do not know which one they use.

Still stored only in the browser, even in server mode (the backend has no endpoint yet): files and links,
member responsibilities, settings, and the notification list (deadline, overdue and open-feedback
notifications are recomputed from server data each time a project loads). Profile edits and account deletion
also only change the local session.

Every component needs a due date. Revisions in server mode are one card per component: its status plus a
checklist of that component's tasks.

## Main features

- Projects and components (add, edit, delete, status, deadline, owner, progress)
- Feedback history that is never overwritten, with clarification requests and replies
- **Next Action System**: turn a feedback item into assigned, dated, trackable tasks
- Revision checklists with a status workflow (Pending → Submitted → Under Review → For Revision → Resubmitted → Approved)
- Student-recorded adviser approval (instructor accounts are optional)
- Files and links, revision history/timeline, team members and tasks, notifications, settings
