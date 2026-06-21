# DevCollab — Implementation Plan

This is the exact order you build things in. Never jump ahead. Every step builds on the previous one and has a concrete "done" condition you can verify.

---

## Phase 1 — Foundation (Week 1)

### Step 1.1 — Repo and folder structure

What you do:
- Create GitHub repo, clone it
- Create the monorepo folder structure manually
- Create placeholder files (empty index.js, .gitignore, etc.)
- Add .gitignore for node_modules, .env, dist, build

Done when: you can push the empty structure to GitHub with no node_modules committed

Commit message: `chore: initialize monorepo folder structure`

### Step 1.2 — Docker Compose

What you do:
- Write docker-compose.yml with three services: app (Node), mongo, redis
- Write server/.env.example with all required keys
- Test that `docker-compose up` starts all three services without errors
- Verify MongoDB is reachable at localhost:27017 (open MongoDB Compass and connect)
- Verify Redis is reachable at localhost:6379 (run `redis-cli ping` inside the container)

Done when: `docker-compose up` runs, all three containers are green, Compass can connect

Commit message: `chore: add docker-compose for local dev environment`

### Step 1.3 — Express server skeleton

What you do:
- `npm init` inside /server
- Install: express, mongoose, dotenv, cors, helmet, morgan
- Install dev: nodemon
- Write server/src/app.js — creates Express app, registers middleware (cors, helmet, json body parser, morgan), exports it
- Write server/src/server.js — imports app, connects to MongoDB, starts listening on PORT
- Write server/src/config/db.js — the Mongoose connection logic
- Test: `node src/server.js` logs "MongoDB connected" and "Server running on port 5000"

Done when: server starts, connects to MongoDB, and you get the expected log messages

Commit message: `feat: add Express server with MongoDB connection`

### Step 1.4 — User model

What you do:
- Write server/src/models/User.js with the schema from schema.md
- Add a pre-save hook that hashes the password using bcrypt before saving
- Add an instance method `comparePassword(candidate)` that runs bcrypt.compare

Done when: you can import the model in Node REPL and create a User document

Commit message: `feat: add User mongoose model with password hashing`

### Step 1.5 — Auth routes

What you do:
- Write server/src/controllers/auth.controller.js with three functions: register, login, refresh, logout
- Write server/src/routes/auth.routes.js that maps POST /register → register, POST /login → login, etc.
- Register the router in app.js under /api/auth
- Install: jsonwebtoken, bcryptjs, zod
- Add Zod validation middleware for register and login request bodies
- Test all four endpoints in Postman

Done when:
- POST /api/auth/register with valid body → 201 with accessToken
- POST /api/auth/register with duplicate email → 409
- POST /api/auth/register with missing fields → 400 with validation errors
- POST /api/auth/login with correct password → 200 with accessToken
- POST /api/auth/login with wrong password → 401
- POST /api/auth/refresh with valid cookie → 200 with new accessToken

Commit message: `feat: implement register, login, and refresh token endpoints`

### Step 1.6 — Auth middleware

What you do:
- Write server/src/middleware/auth.middleware.js
- It reads the Authorization header, verifies the JWT, attaches decoded payload to req.user
- Returns 401 if token is missing, malformed, or expired

Done when: adding this middleware to any route blocks access without a valid token

Commit message: `feat: add JWT auth middleware`

### Step 1.7 — ESLint + Prettier + Husky

What you do:
- Install eslint, @eslint/js, prettier, eslint-config-prettier as dev deps
- Write .eslintrc.json and .prettierrc in the repo root
- Install husky, lint-staged as dev deps
- Configure husky pre-commit hook to run lint-staged on staged files

Done when: trying to commit code with a lint error causes the commit to be rejected

Commit message: `chore: configure ESLint, Prettier, and Husky pre-commit hooks`

### Step 1.8 — React app (client)

What you do:
- Run `npm create vite@latest client -- --template react` from the repo root
- Install: axios, react-router-dom, zustand, react-hook-form, @hookform/resolvers, zod
- Clean out the boilerplate (delete App.css, edit App.jsx to return a blank div)
- Set up folder structure: src/pages, src/components, src/stores, src/api, src/utils
- Write a minimal axios instance in src/api/axios.js with baseURL from env variable
- Write the Zustand auth store in src/stores/authStore.js — stores { user, accessToken } and actions: setAuth, clearAuth
- Write the Login page (just the form, no styling yet)
- Write the Register page
- Wire up React Router in App.jsx with routes for /login, /register, /dashboard

Done when: you can run the React app, fill in the login form, it calls the API, and stores the returned token in Zustand

Commit message: `feat: scaffold React app with auth pages and Zustand store`

---

## Phase 2 — Core CRUD (Week 2–3)

### Step 2.1 — MongoDB schemas for Project, Task, ActivityLog

Write the three Mongoose models based on schema.md. Add the indexes as specified.

Commit: `feat: add Project, Task, and ActivityLog mongoose models`

### Step 2.2 — Projects API

Write controllers and routes for:
- POST /api/projects — create (auth required)
- GET /api/projects — list all projects for current user
- GET /api/projects/:id — get one project (must be a member)
- PUT /api/projects/:id — update name/description (Owner only)
- DELETE /api/projects/:id — delete project and all its tasks (Owner only)
- POST /api/projects/:id/invite — invite a member (Owner only)
- PUT /api/projects/:id/members/:userId/role — change role (Owner only)
- DELETE /api/projects/:id/members/:userId — remove member (Owner only)

For each route that checks roles: write a reusable `requireRole(...roles)` middleware that reads req.user.userId, finds their role in the project's members array, and returns 403 if they don't have the required role.

Commit: `feat: implement projects CRUD and member management API`

### Step 2.3 — Tasks API

Write controllers and routes for:
- POST /api/projects/:projectId/tasks — create task
- GET /api/projects/:projectId/tasks — list tasks (with cursor-based pagination)
- GET /api/projects/:projectId/tasks/:taskId — get one task
- PUT /api/projects/:projectId/tasks/:taskId — update task (Member or Owner)
- DELETE /api/projects/:projectId/tasks/:taskId — delete task (Member or Owner)
- POST /api/projects/:projectId/tasks/:taskId/comments — add comment

Every mutation also writes an ActivityLog entry. Write a helper function `logActivity(projectId, userId, action, metadata)` in utils/activity.js and call it from each mutation.

When a task's status changes to 'done', set completedAt to now.

Commit: `feat: implement tasks CRUD API with activity logging`

### Step 2.4 — Kanban board UI

Build the React kanban board:
- Fetch tasks for the current project on page load
- Split them into three arrays by status: todo, in_progress, done
- Render KanbanColumn for each with TaskCards
- Install @dnd-kit/core and @dnd-kit/sortable
- Implement drag-and-drop: onDragEnd calls the task update API and updates Zustand state
- Implement the "Add task" quick-add input at the bottom of the Todo column
- Implement TaskDrawer: clicking a card opens a drawer with the full task detail

Commit: `feat: implement kanban board with drag-and-drop`

### Step 2.5 — Members page UI

Build the React members page:
- List all members with their name, email, role badge, and a remove button (Owner only)
- Add an "Invite member" button that opens a modal with email + role select
- Role change dropdown next to each member (Owner only, can't change own role)

Commit: `feat: implement project members management UI`

---

## Phase 3 — Real-time (Week 4)

### Step 3.1 — Socket.io server

What you do:
- Install socket.io on the server
- Modify server.js to attach Socket.io to the HTTP server (not the Express app directly)
- Create server/src/socket/index.js — sets up connection handling
- Authenticate socket connections: on the handshake, verify the JWT from the auth header
- Handle events: join:project, leave:project
- Export a function `emitToProject(projectId, event, data)` that other modules can call

Commit: `feat: add Socket.io server with auth and project rooms`

### Step 3.2 — Emit events from task mutations

In each task mutation controller (update, create, delete, comment), after the database write, call emitToProject() with the appropriate event:
- `task:created` with the new task data
- `task:updated` with the taskId and changed fields
- `task:deleted` with the taskId
- `task:commented` with the new comment

Also emit `activity:new` with the log entry on every mutation.

Commit: `feat: emit socket events on task mutations`

### Step 3.3 — Socket.io client

In React:
- Install socket.io-client
- Create src/socket.js — creates and exports the socket instance with the auth token
- Create a useSocket hook that connects when the user is logged in and disconnects on logout
- In the KanbanBoard component: join the project room on mount, leave on unmount
- Listen for task:updated, task:created, task:deleted events and update Zustand accordingly
- In the ActivityFeed component: listen for activity:new and prepend to the feed

Commit: `feat: integrate Socket.io client for real-time kanban updates`

### Step 3.4 — Redis caching

What you do:
- Install ioredis
- Create server/src/config/redis.js — creates and exports the Redis client
- Write a cache middleware factory: `cacheResponse(keyFn, ttl)` — checks Redis before the handler, stores the response in Redis after
- Apply to: GET /api/projects/:id (dashboard data), GET /api/projects/:projectId/analytics
- Write an `invalidateCache(...keys)` helper
- Call invalidateCache in every task mutation after the database write

Commit: `feat: add Redis caching for dashboard and analytics routes`

### Step 3.5 — Rate limiting

Install express-rate-limit. Apply a global rate limiter (100 req/15min per IP) and a stricter limiter on auth routes (10 req/15min per IP).

Commit: `feat: add rate limiting on API routes`

---

## Phase 4 — Email Queue (Week 5)

### Step 4.1 — Bull queue setup

What you do:
- Install bull, nodemailer
- Create server/src/queues/emailQueue.js — creates a Bull queue named 'email-queue' backed by the Redis connection
- Create server/src/workers/email.worker.js — processes jobs from the queue, sends emails via Nodemailer
- Start the worker in server.js alongside the Express server
- Create server/src/utils/mail.js — the Nodemailer transporter configured with Mailtrap credentials from env

Commit: `feat: set up Bull email queue with Nodemailer worker`

### Step 4.2 — Queue jobs from task assignment

In the task update controller, after updating assigneeId, push a job:
```javascript
emailQueue.add('task-assigned', {
  to: assignee.email,
  taskTitle: task.title,
  projectName: project.name,
  assignedBy: req.user.name
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 }
})
```

Similarly for project invitations.

Commit: `feat: queue assignment and invitation emails on task mutations`

### Step 4.3 — Bull Dashboard

Install bull-board. Mount it at /admin/queues (accessible in development only). Now you can see waiting/active/completed/failed jobs in a browser UI.

Commit: `feat: add Bull Dashboard for queue monitoring`

---

## Phase 5 — Analytics (Week 6)

### Step 5.1 — Analytics API

Write GET /api/projects/:projectId/analytics (Owner only):
- Check Redis cache first
- If miss: run three MongoDB aggregation pipelines:
  1. Tasks completed per member (filter: status=done, completedAt within range, group by assigneeId)
  2. Average completion time per project (completedAt - createdAt, averaged across all done tasks)
  3. Status breakdown count (group by status, count)
- Store combined result in Redis with 5-minute TTL
- Return the data

Commit: `feat: implement analytics API with Redis caching and MongoDB aggregations`

### Step 5.2 — Analytics UI

Build the analytics page with Recharts:
- BarChart: tasks completed per member (x-axis: member names, y-axis: count)
- PieChart/Radial: status breakdown (todo/in_progress/done)
- Stat cards: avg completion time, total tasks, active members this week

Commit: `feat: implement analytics dashboard with Recharts visualizations`

---

## Phase 6 — CI/CD (Week 7)

### Step 6.1 — Tests

Write integration tests with Jest + Supertest for the auth routes and at least the task CRUD routes. The goal is enough test coverage that CI has something meaningful to run.

Commit: `test: add integration tests for auth and task routes`

### Step 6.2 — GitHub Actions workflow

Write .github/workflows/ci.yml:
```yaml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup Node 20
      - npm install (server)
      - npm run lint
      - npm test
```

Commit: `ci: add GitHub Actions workflow for lint and test`

### Step 6.3 — Deployment

- Create MongoDB Atlas free cluster, get connection string
- Deploy backend to Render: connect GitHub repo, set environment variables, choose Node service
- Deploy frontend to Vercel: connect GitHub repo, set VITE_API_URL to Render URL
- Create Render deploy hook, add to GitHub Actions CD workflow
- Set up Uptime Robot monitor on the Render URL

Commit: `chore: add CD workflow and deployment configuration`

### Step 6.4 — Sentry

- Create Sentry project for Node, get DSN
- Install @sentry/node in server, initialize in server.js
- Create Sentry project for React, get DSN
- Install @sentry/react in client, wrap App with Sentry.ErrorBoundary

Commit: `feat: integrate Sentry error monitoring on frontend and backend`

---

## Phase 7 — Polish (Week 8)

### Step 7.1 — Seed script

Write server/scripts/seed.js that:
- Creates 3 demo users
- Creates 2 projects
- Creates 15-20 tasks spread across statuses
- Creates some activity log entries and comments

Run with `node scripts/seed.js` against the production database before sharing the live link.

Commit: `chore: add database seed script for demo data`

### Step 7.2 — README

Write a README.md that includes:
- Project description (2-3 sentences)
- Tech stack list with brief reason for each choice
- Architecture diagram (embed the Figma export as a PNG)
- Local setup instructions (docker-compose up, .env setup, npm install)
- Live URL and demo video link
- API documentation link (Postman collection)
- Screenshots of the kanban board, analytics page, activity feed

Commit: `docs: write comprehensive README with setup and architecture`

### Step 7.3 — Export Postman collection

In Postman, organize all requests into folders matching the API routes. Add example request bodies and expected responses. Export as Collection v2.1 JSON. Commit as `docs/api-collection.json`.

Commit: `docs: add Postman API collection`

---

## Commit discipline

Every commit should:
1. Do exactly one thing
2. Have a meaningful message in conventional commit format
3. Leave the codebase working (never commit broken code to main)

Work on feature branches, merge to main via PRs. Even if you're working alone, this simulates real team workflow and gives you a clean PR history to show.

Branch naming: `feat/task-drag-drop`, `fix/jwt-refresh-race-condition`, `chore/add-rate-limiting`

Never push directly to main after the first few setup commits. Always branch → PR → merge.
