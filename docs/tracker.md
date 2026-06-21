# DevCollab — Progress Tracker

Update this file every session. Mark items done as you finish them. Add notes, blockers, and decisions made along the way.

---

## Overall progress

| Phase | Status | Week target | Completed |
|---|---|---|---|
| Phase 1 — Foundation | 🔲 Not started | Week 1 | — |
| Phase 2 — Core CRUD | 🔲 Not started | Week 2–3 | — |
| Phase 3 — Real-time | 🔲 Not started | Week 4 | — |
| Phase 4 — Email Queue | 🔲 Not started | Week 5 | — |
| Phase 5 — Analytics | 🔲 Not started | Week 6 | — |
| Phase 6 — CI/CD | 🔲 Not started | Week 7 | — |
| Phase 7 — Polish | 🔲 Not started | Week 8 | — |

---

## Phase 1 — Foundation checklist

- [ ] GitHub repo created
- [ ] Monorepo folder structure created and pushed
- [ ] docker-compose.yml written — Node + MongoDB + Redis
- [ ] docker-compose up works with no errors
- [ ] MongoDB reachable via Compass
- [ ] Redis reachable (redis-cli ping returns PONG)
- [ ] Express server skeleton — app.js, server.js, config/db.js
- [ ] Server starts and connects to MongoDB
- [ ] User model created — schema, password hashing pre-hook, comparePassword method
- [ ] Zod validation middleware written
- [ ] POST /api/auth/register — working in Postman
- [ ] POST /api/auth/login — working in Postman
- [ ] POST /api/auth/refresh — working in Postman
- [ ] POST /api/auth/logout — working in Postman
- [ ] JWT auth middleware written
- [ ] ESLint configured
- [ ] Prettier configured
- [ ] Husky pre-commit hook configured — bad code is rejected
- [ ] Vite + React app created in /client
- [ ] React packages installed: axios, react-router-dom, zustand, react-hook-form, zod
- [ ] Axios instance created with baseURL and interceptors
- [ ] Zustand auth store created
- [ ] Login page — form, validation, API call, store update
- [ ] Register page — form, validation, API call, store update
- [ ] React Router set up with routes

**Phase 1 milestone:** docker-compose up starts everything. Register → login → get JWT → hit protected route — all working in Postman ✓

---

## Phase 2 — Core CRUD checklist

- [ ] Project model created
- [ ] Task model created
- [ ] ActivityLog model created
- [ ] Indexes added to all three models
- [ ] requireRole middleware written
- [ ] POST /api/projects — create project
- [ ] GET /api/projects — list user's projects
- [ ] GET /api/projects/:id — get one project (member check)
- [ ] PUT /api/projects/:id — update (Owner only)
- [ ] DELETE /api/projects/:id — delete (Owner only)
- [ ] POST /api/projects/:id/invite — invite member (Owner only)
- [ ] PUT /api/projects/:id/members/:userId/role — change role (Owner only)
- [ ] DELETE /api/projects/:id/members/:userId — remove member (Owner only)
- [ ] logActivity helper function written
- [ ] POST /api/projects/:projectId/tasks — create task + log entry
- [ ] GET /api/projects/:projectId/tasks — list with pagination
- [ ] GET /api/projects/:projectId/tasks/:taskId — get one task
- [ ] PUT /api/projects/:projectId/tasks/:taskId — update + log entry + set completedAt
- [ ] DELETE /api/projects/:projectId/tasks/:taskId — delete + log entry
- [ ] POST /api/projects/:projectId/tasks/:taskId/comments — add comment + log entry
- [ ] GET /api/projects/:projectId/activity — paginated activity feed
- [ ] Kanban board component built
- [ ] TaskCard component built
- [ ] dnd-kit drag-and-drop wired up
- [ ] TaskDrawer built — detail view, editable fields
- [ ] Members page built — list, invite modal, role change, remove

**Phase 2 milestone:** Can create a project, invite a member, create tasks, move them across columns from React UI ✓

---

## Phase 3 — Real-time checklist

- [ ] socket.io installed on server
- [ ] Socket.io attached to HTTP server
- [ ] Socket auth middleware (verify JWT on handshake)
- [ ] join:project and leave:project event handlers
- [ ] emitToProject() utility function written
- [ ] task:created emitted after task creation
- [ ] task:updated emitted after task update
- [ ] task:deleted emitted after task deletion
- [ ] task:commented emitted after comment added
- [ ] activity:new emitted after every log entry
- [ ] socket.io-client installed in React
- [ ] Socket instance created with auth token
- [ ] useSocket hook written
- [ ] KanbanBoard joins/leaves project room
- [ ] task:updated handler updates Zustand + re-renders board
- [ ] task:created handler adds new card to correct column
- [ ] task:deleted handler removes card
- [ ] ActivityFeed listens for activity:new
- [ ] ioredis installed, Redis client created
- [ ] cacheResponse middleware written
- [ ] Cache applied to project dashboard route
- [ ] invalidateCache called on task mutations
- [ ] express-rate-limit installed and configured

**Phase 3 milestone:** Open two browser tabs, move task in one, it moves in the other instantly ✓

---

## Phase 4 — Email Queue checklist

- [ ] bull installed
- [ ] nodemailer installed
- [ ] Mailtrap account created, credentials in .env
- [ ] emailQueue.js created — queue instance
- [ ] email.worker.js created — processes jobs, sends via Nodemailer
- [ ] Worker started in server.js
- [ ] mail.js utility — Nodemailer transporter
- [ ] Task assignment queues email job
- [ ] Project invitation queues email job
- [ ] Retry logic configured: 3 attempts, exponential backoff
- [ ] bull-board installed, mounted at /admin/queues
- [ ] Email arrives in Mailtrap after task assignment

**Phase 4 milestone:** Assign task → API responds instantly → email in Mailtrap inbox → Bull Dashboard shows completed job ✓

---

## Phase 5 — Analytics checklist

- [ ] GET /api/projects/:projectId/analytics — RBAC: Owner only
- [ ] MongoDB aggregation: tasks completed per member
- [ ] MongoDB aggregation: average completion time
- [ ] MongoDB aggregation: status breakdown
- [ ] Redis cache applied to analytics route (5-minute TTL)
- [ ] Analytics cache invalidated on task status changes
- [ ] Analytics page route added to React Router
- [ ] BarChart — tasks completed per member
- [ ] PieChart — status breakdown
- [ ] Stat cards — avg completion time, total tasks, active members

**Phase 5 milestone:** Analytics page loads from Redis in <10ms vs ~80ms from MongoDB ✓

---

## Phase 6 — CI/CD checklist

- [ ] Jest and Supertest installed
- [ ] Auth routes tests written
- [ ] Task routes tests written
- [ ] npm test runs all tests and passes
- [ ] .github/workflows/ci.yml written
- [ ] CI passes on GitHub Actions
- [ ] MongoDB Atlas cluster created
- [ ] Backend deployed to Render with prod env variables
- [ ] Frontend deployed to Vercel with prod env variables
- [ ] Live URL accessible — kanban board works
- [ ] CD workflow triggers deploy on push to main
- [ ] Uptime Robot monitor set up
- [ ] Sentry Node SDK installed and initialized
- [ ] Sentry React SDK installed and initialized
- [ ] Test error appears in Sentry dashboard

**Phase 6 milestone:** push to main → CI runs → deploys → live URL works → Sentry catches errors ✓

---

## Phase 7 — Polish checklist

- [ ] Seed script written and run against production DB
- [ ] Demo has realistic-looking data (3 users, 2 projects, 20 tasks spread across statuses)
- [ ] README written: description, stack, architecture diagram, setup, live link, video
- [ ] Loom demo video recorded (2-3 minutes, showing WebSocket sync as the highlight)
- [ ] Postman collection organized and exported as docs/api-collection.json
- [ ] GitHub repo: pinned, topics added (mern, websockets, redis, docker, real-time)
- [ ] Resume line written and added to resume

**Phase 7 milestone:** recruiter can open GitHub, read README, click live URL, watch video — in under 3 minutes ✓

---

## Session log

Use this section to record what happened each work session.

### Session 1 — [date]
- What I did:
- Time spent:
- What's next:
- Blockers:

### Session 2 — [date]
- What I did:
- Time spent:
- What's next:
- Blockers:

---

## Decisions log

Record every technical decision you make and why. This is interview prep material — interviewers ask "why did you choose X over Y?"

| Decision | Why | Alternatives considered |
|---|---|---|
| MongoDB over PostgreSQL | Existing Helpdesk project uses MySQL — shows two paradigms. Task documents benefit from embedding comments. | PostgreSQL (would require separate comments table and JOINs) |
| Zustand over Redux | Simpler API, less boilerplate. App state is not complex enough to justify Redux | Redux Toolkit, React Context |
| dnd-kit over react-beautiful-dnd | react-beautiful-dnd is unmaintained. dnd-kit is actively developed and more flexible. | react-beautiful-dnd, react-dnd |
| Bull over custom queue | Bull handles retries, backoff, job persistence, and monitoring out of the box. Writing a queue from scratch would take days and be less reliable. | Custom setInterval-based polling, Agenda |

Add to this table every time you make a choice between options.
