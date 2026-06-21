# DevCollab — Project Requirements

## What this project is

DevCollab is a real-time collaborative task management web application. Think of it like a simplified Jira or Trello, but built entirely by you, from scratch, with a production-grade backend. The goal is not just to "make it work" — it's to build something that demonstrates you understand how software actually runs in the real world: background jobs, caching, live updates, role permissions, automated deployments.

The project runs 8 weeks. Every week has a concrete milestone. By the end, you will have a live URL, a GitHub repo with meaningful commit history, and a resume line that can hold up to interview questioning.

---

## Who uses this app

There are three types of users inside a project:

**Owner** — the person who created the project. Can do everything: create tasks, invite people, remove members, delete the project, view analytics.

**Member** — someone invited to the project. Can create tasks, update tasks, move tasks across columns, add comments. Cannot invite others or delete the project.

**Viewer** — read-only access. Can see everything but cannot change anything.

These three roles are enforced on the backend, not just hidden in the UI. If a Viewer tries to call the task update API directly (e.g., via Postman), the server rejects it.

---

## Core features — what the app must do

### Authentication
- A user can register with name, email, password
- Passwords are hashed before storing (bcrypt)
- Login returns two tokens: an access token (short-lived, 15 minutes) and a refresh token (long-lived, 7 days)
- The access token is sent with every API request in the Authorization header
- When the access token expires, the frontend silently uses the refresh token to get a new one — the user never sees a logout

### Projects
- A user can create a project (they become the Owner)
- Owner can invite others by email — invitee gets an email with a link
- Owner can change a member's role or remove them
- Project has a name, description, and creation date

### Tasks
- Tasks live inside a project
- Every task has: title, description, assignee, status (Todo / In Progress / Done), priority (Low / Medium / High), due date
- Tasks are displayed in a Kanban board — three columns, one per status
- Drag a card from one column to another → status updates in the database → all other members see it move on their screen instantly (WebSocket)
- Clicking a task opens a detail modal — you can edit fields, add comments, see the activity history of that task

### Activity log
- Every time something changes (task created, status moved, assignee changed), a log entry is written automatically
- There is a page that shows a live feed of recent activity across the project
- New entries appear without page refresh (WebSocket pushes them)

### Email notifications
- When a task is assigned to someone, they get an email
- This email is NOT sent inline inside the API response (that would slow the API down)
- Instead: the API pushes a job into a queue, responds to the frontend immediately, and a separate background worker picks up the job and sends the email
- If the email fails, it retries 3 times with increasing delays (1s, 5s, 30s)

### Analytics (Owner only)
- How many tasks each member has completed this week and this month
- Average time from task creation to task completion, per project
- A bar chart and donut chart showing task status breakdown
- All of this is served from Redis cache — the first load hits the database, subsequent loads return the cached value in under 10ms
- The cache is cleared whenever a relevant task mutation happens

### Caching
- Redis sits in front of expensive database queries
- Dashboard data and analytics data are cached with a TTL (time-to-live)
- On any task create/update/delete, the relevant cache keys are invalidated

---

## What the app must NOT do (out of scope)

- No file attachments on tasks
- No video/audio chat
- No mobile app — web only
- No payment or subscription system
- No multi-language support

---

## Non-functional requirements

**Performance** — Analytics page must load cached data in under 10ms. API responses must be under 200ms for standard CRUD.

**Security** — All routes except /register and /login are protected. RBAC is enforced server-side. Passwords are never stored plain. JWT secrets are in environment variables, never in code.

**Reliability** — Email jobs retry on failure. The app does not crash if Redis is temporarily unavailable (graceful degradation).

**Code quality** — ESLint and Prettier enforce consistent style. Husky prevents committing code that fails the linter. All commits follow conventional commit format.

**Observability** — Sentry catches and reports runtime errors in both frontend and backend. Uptime Robot pings the live URL every 5 minutes.

---

## Deployment targets

- Backend → Render (free tier, Node.js service)
- Frontend → Vercel (free tier)
- Database → MongoDB Atlas (free tier, M0 cluster)
- Redis → Render Redis or Upstash (free tier)
- Email (dev) → Mailtrap inbox
- Email (prod) → Resend

---

## Success criteria

A recruiter can open the GitHub link, read the README in under 2 minutes, click the live URL, and see a working kanban board with real data. The demo video shows two browser tabs with live sync. The resume line has a concrete number: "reduced DB calls by ~70% via Redis caching."
