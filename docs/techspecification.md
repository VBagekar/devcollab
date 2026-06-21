# DevCollab — Tech Specification

## Stack overview

This is a MERN stack application with two extra infrastructure pieces: Redis (for caching and job queuing) and Socket.io (for real-time communication).

MERN stands for:
- **M** — MongoDB (database)
- **E** — Express.js (backend framework)
- **R** — React (frontend)
- **N** — Node.js (runtime that Express runs on)

Every technology choice below is deliberate and has a reason. You should be able to explain any of them in an interview.

---

## Backend

### Runtime — Node.js v20 LTS
Node.js lets you write server-side code in JavaScript. LTS means Long Term Support — it's the stable version used in production at most companies. We're not using the latest experimental version because stability matters more than new features here.

### Framework — Express.js v4
Express is a minimal web framework for Node. It handles HTTP requests and lets you define routes (URLs the server responds to) and middleware (functions that run before your route handler — like checking if someone is logged in).

Why Express and not something else (like Fastify or NestJS)? Because Express is the most widely used Node framework, has the biggest community, and is what most internship interviewers will expect you to know. NestJS adds a lot of complexity that isn't worth it at this stage.

### Database — MongoDB with Mongoose
MongoDB stores data as documents (think JSON objects) instead of rows and tables like MySQL. This makes it natural to store things like a task with embedded comments, or a user with an array of project IDs.

Mongoose is the library that sits on top of MongoDB and lets you define schemas (the shape your data must have), add validation, and write readable queries. Without Mongoose you're writing raw MongoDB commands which is more error-prone.

Why MongoDB here instead of MySQL? Because the Helpdesk Portal already uses MySQL/Spring Boot. Using MongoDB here shows you know both paradigms — document vs relational. Also, for collaborative apps where documents can have varying shapes (tasks with different numbers of custom fields, for example), MongoDB is genuinely the right tool.

### Authentication — JWT with refresh token rotation
JWT stands for JSON Web Token. When you log in, the server creates two tokens:

**Access token** — contains your user ID and role, signed with a secret key. Valid for 15 minutes. Sent with every API request in the `Authorization: Bearer <token>` header. The server verifies the signature on every request — no database lookup needed, which makes it fast.

**Refresh token** — stored in the database (so it can be revoked) and sent as an HTTP-only cookie (so JavaScript can't read it, protecting against XSS attacks). Valid for 7 days. Used only to get a new access token when the old one expires.

Why not just use a single long-lived token? Because if an access token is stolen, it can be used until it expires. With a 15-minute expiry, the damage window is small. The refresh token can be revoked from the database if a user logs out or reports a compromise.

### Real-time — Socket.io
Socket.io enables bidirectional communication between server and browser. Unlike regular HTTP (where the browser asks, server answers, connection closes), a WebSocket connection stays open. The server can push data to the browser at any time.

We use this for: live kanban updates, live activity feed. When user A moves a task, the server broadcasts that event to all other members currently viewing the same project. Their boards update without any refresh.

Socket.io is built on top of the WebSocket protocol but handles reconnection, fallbacks, and rooms (grouping multiple connections) automatically.

### Caching — Redis
Redis is an in-memory data store — meaning data lives in RAM, not on disk. RAM access is orders of magnitude faster than disk access, which is why Redis is used for caching.

How it works in DevCollab: when the analytics page loads for the first time, the server runs expensive MongoDB aggregation queries and stores the result in Redis with a key like `analytics:projectId:userId` and a TTL (expiry) of 5 minutes. The next time anyone loads that page, the server checks Redis first. If the key exists, it returns the cached value immediately — no database involved. If the key doesn't exist (expired or invalidated), it runs the database query again and caches the new result.

We also use Redis as the backing store for the Bull job queue (see below).

### Job queue — Bull
Bull is a queue library for Node that uses Redis to store jobs. A "job" is a unit of work you want to do in the background.

Why do email in the background? Because sending an email involves making an HTTPS request to an external email service. That can take 200–800ms. If you do it inside your API handler, the user's request is blocked for that entire time. With Bull: the API handler adds a job to the queue (takes ~1ms) and responds immediately. A separate worker process is watching the queue, picks up the job, sends the email, and marks it done — entirely independently of the API response.

This is a real-world pattern used in every production backend you will ever work on.

### Email — Nodemailer + Mailtrap (dev) / Resend (prod)
Nodemailer is the Node library for sending emails. In development, we point it at Mailtrap — a fake email inbox that catches all outgoing mail so you don't accidentally email real people. In production, we switch to Resend which has a reliable free tier and good deliverability.

### Validation — Zod
Every incoming request body is validated before hitting the database. Zod lets you define a schema like "this field must be a non-empty string, this field must be a valid email, this field must be one of these three values" and rejects invalid requests with a clear error message.

### Error monitoring — Sentry
Sentry catches runtime errors and sends you a notification with the stack trace, the request that caused it, and the user who was affected. You add one import and initialization call to both your server and React app. From then on, any unhandled error shows up in the Sentry dashboard.

---

## Frontend

### Framework — React 18 with Vite
React builds user interfaces from components — reusable pieces of UI that manage their own state. Vite is the build tool — it compiles and bundles your React code for the browser, and provides a fast development server with hot module replacement (changes appear in the browser instantly without a full reload).

Why Vite and not Create React App? Because Create React App is slow and no longer actively maintained. Vite is the current standard.

### State management — Zustand
Zustand is a lightweight state management library. Some state (like the current user, the list of projects, the tasks in the current view) needs to be accessible from multiple components that aren't directly related. Zustand gives you a global store that any component can read from or write to. It's simpler than Redux and appropriate for an app of this size.

### HTTP client — Axios
Axios is the library used to make API calls from React to the Express backend. It handles JSON serialization, lets you set default headers (like the Authorization token), and has interceptors — functions that run before every request or after every response. We use a response interceptor to automatically handle 401 errors (token expired) by requesting a new access token and retrying the original request.

### Drag and drop — dnd-kit
dnd-kit is the library that makes the Kanban board draggable. It handles mouse events, touch events, keyboard accessibility, and gives you hooks to integrate drag state into your React components.

### Charts — Recharts
Recharts is a chart library built on top of React and D3. Used for the analytics page — bar chart (tasks completed per member) and donut chart (status breakdown).

### Styling — Tailwind CSS
Tailwind provides utility classes you apply directly in JSX. Instead of writing a separate CSS file, you write `className="flex items-center gap-4 rounded-lg bg-white shadow"`. This keeps styles co-located with markup and eliminates unused CSS in production automatically.

---

## Infrastructure

### Containerization — Docker Compose
Docker lets you package an application and all its dependencies into a container that runs identically on any machine. Docker Compose lets you define multiple containers (Node server, MongoDB, Redis) in one file and start them all with a single command: `docker-compose up`.

In development, this means you don't install MongoDB or Redis directly on your laptop. You run them in containers. Anyone else who clones the repo gets the exact same environment — no "it works on my machine" problems.

### CI/CD — GitHub Actions
CI stands for Continuous Integration: automatically run your tests and linter on every push to GitHub, catching problems before they reach the main branch. CD stands for Continuous Deployment: automatically deploy the app to Render/Vercel when code is merged to main.

GitHub Actions is GitHub's built-in CI/CD system. You define workflows in YAML files inside `.github/workflows/`. A workflow says: "when someone pushes to main, run npm install, run the linter, run the tests, and if all pass, trigger a deploy."

### Code quality — ESLint + Prettier + Husky
ESLint checks your JavaScript for errors and bad patterns (like using a variable before declaring it, or forgetting to handle a promise rejection).

Prettier formats your code consistently — indentation, quote style, trailing commas. You never argue about formatting again.

Husky runs both of these automatically before you're allowed to commit. If your code has a lint error, the commit is rejected. This means the repository never accumulates messy code.

---

## Environment variables

Nothing sensitive ever goes in code. Every secret lives in a `.env` file locally and in the hosting platform's environment variable settings in production.

Variables we'll need:
```
# Server
PORT=5000
MONGODB_URI=mongodb://localhost:27017/devcollab
JWT_ACCESS_SECRET=<random 64-char string>
JWT_REFRESH_SECRET=<random 64-char string>
REDIS_URL=redis://localhost:6379
MAILTRAP_USER=<from mailtrap>
MAILTRAP_PASS=<from mailtrap>
SENTRY_DSN=<from sentry>

# Client
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_SENTRY_DSN=<from sentry>
```

The `.env` file is in `.gitignore`. You commit a `.env.example` file with the same keys but empty values, so anyone cloning the repo knows what variables they need to set.

---

## API design principles

All API routes follow REST conventions:

- `GET /api/projects` — list all projects for the logged-in user
- `POST /api/projects` — create a project
- `GET /api/projects/:id` — get one project
- `PUT /api/projects/:id` — update a project
- `DELETE /api/projects/:id` — delete a project

Same pattern applies to tasks, nested under projects: `GET /api/projects/:projectId/tasks`

All responses have a consistent shape:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Task not found", "code": "TASK_NOT_FOUND" }
```

HTTP status codes are used correctly:
- 200 — success
- 201 — resource created
- 400 — bad request (validation failed)
- 401 — not authenticated
- 403 — authenticated but not authorized (wrong role)
- 404 — not found
- 500 — server error
