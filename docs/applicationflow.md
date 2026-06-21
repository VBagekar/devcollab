# DevCollab — Application Flow

This document traces exactly what happens, step by step, when a user does something in the app. Read this before writing any code. If you understand these flows, you understand the entire architecture.

---

## Flow 1: User registers

1. User fills in the register form (name, email, password) and hits Submit
2. React sends `POST /api/auth/register` with `{ name, email, password }` in the request body
3. Express receives the request — the first thing that runs is the Zod validation middleware, which checks:
   - name is a non-empty string
   - email matches email format
   - password is at least 8 characters
   If any check fails, it immediately returns `400 Bad Request` with what was wrong
4. If validation passes, the register controller runs:
   - Checks if a user with that email already exists in MongoDB
   - If yes, returns `409 Conflict`
   - If no, hashes the password using bcrypt (the hash is a one-way transformation — you can never reverse it back to the original password)
   - Creates the User document in MongoDB
   - Generates an access token (JWT, signed with ACCESS_SECRET, expires in 15 minutes, contains `{ userId, email }`)
   - Generates a refresh token (JWT, signed with REFRESH_SECRET, expires in 7 days)
   - Saves the refresh token hash in the database (on the User document)
   - Sets the refresh token as an HTTP-only cookie on the response
   - Returns `201 Created` with `{ user: { id, name, email }, accessToken }`
5. React receives the response, stores the access token in memory (a Zustand store), and redirects to the dashboard

---

## Flow 2: User logs in

Same as registration from step 2 onward, except:
- Step 4 starts by finding the user by email (returns 404 if not found)
- Then compares the submitted password against the stored hash using `bcrypt.compare` (returns 403 if wrong)
- Generates new tokens and returns them

---

## Flow 3: Making an authenticated API request

Every API request after login must include the access token.

1. React's Axios instance has a request interceptor that runs before every outgoing request
2. The interceptor reads the access token from the Zustand store and adds the header: `Authorization: Bearer <token>`
3. Express receives the request and runs the `authMiddleware` before the route handler
4. authMiddleware extracts the token from the header, calls `jwt.verify(token, ACCESS_SECRET)`
5. If the token is invalid or expired, it returns `401 Unauthorized`
6. If valid, jwt.verify returns the decoded payload `{ userId, email }` — this is attached to `req.user` so the route handler knows who's making the request
7. The route handler runs with `req.user` available

---

## Flow 4: Access token expires mid-session

The user is logged in, working, and their 15-minute access token expires. Without refresh token handling, the next API call would return 401 and they'd be logged out.

1. Axios's response interceptor sees the 401 response
2. It automatically sends `POST /api/auth/refresh` — this request includes the HTTP-only cookie (browser does this automatically)
3. The refresh endpoint reads the cookie, verifies the refresh token, checks it exists in the database (to confirm it hasn't been revoked)
4. If valid: generates a new access token, returns it
5. The Axios interceptor stores the new token and retries the original request
6. The user never sees any interruption

---

## Flow 5: User creates a project

1. User fills in project name and description, clicks Create
2. React sends `POST /api/projects` with `{ name, description }`
3. authMiddleware runs — confirms the user is logged in
4. Controller creates a Project document in MongoDB with:
   - name, description
   - `members: [{ userId: req.user.userId, role: 'owner' }]` — the creator is automatically the Owner
5. Returns `201 Created` with the new project
6. React adds it to the project list in Zustand and navigates to the project's kanban board

---

## Flow 6: Owner invites a member

1. Owner goes to the Members page, types an email, selects a role, clicks Invite
2. React sends `POST /api/projects/:id/invite` with `{ email, role }`
3. authMiddleware runs — confirms logged in
4. rbacMiddleware runs — confirms `req.user` is the Owner of this project (checks the members array). If not Owner, returns `403 Forbidden`
5. Controller finds the user by email in the database
6. If found: adds `{ userId, role }` to the project's members array
7. Pushes an email job to the Bull queue: "You've been invited to project X by Y"
8. Returns `200 OK` immediately — the email will go out asynchronously
9. Bull worker picks up the job, sends the email via Nodemailer → Mailtrap

---

## Flow 7: User moves a task on the Kanban board (the most important flow)

This is the flow that demonstrates real-time architecture. Read it carefully.

1. User drags a task card from "Todo" column to "In Progress" column
2. dnd-kit triggers the `onDragEnd` callback in React
3. React optimistically updates the UI immediately (moves the card) — this makes it feel instant
4. React sends `PUT /api/projects/:projectId/tasks/:taskId` with `{ status: 'in_progress' }`
5. authMiddleware runs, rbacMiddleware runs (confirms user is Owner or Member — Viewers can't move tasks)
6. Controller updates the task in MongoDB: `Task.findByIdAndUpdate(taskId, { status: 'in_progress' })`
7. Controller writes an ActivityLog entry: `{ projectId, userId, action: 'task_moved', taskId, from: 'todo', to: 'in_progress', timestamp: now }`
8. Controller invalidates the Redis cache keys for this project's dashboard
9. Controller calls `io.to(projectId).emit('task:updated', { taskId, changes: { status: 'in_progress' } })`
   — this sends a Socket.io event to every connected client in the project's "room"
10. Returns `200 OK` to the user who made the change
11. Every other browser tab/device that has this project open receives the `task:updated` socket event
12. React's socket listener updates the Zustand store with the new task state
13. The Kanban board re-renders — the card appears in the "In Progress" column on their screen

---

## Flow 8: Task assignment → email notification

1. User assigns a task to a team member (sets the assignee field)
2. React sends `PUT /api/projects/:projectId/tasks/:taskId` with `{ assigneeId: 'someUserId' }`
3. Controller updates the task in MongoDB
4. Controller looks up the assignee's email
5. Controller adds a job to the Bull queue:
   ```
   emailQueue.add('task-assigned', {
     to: assignee.email,
     taskTitle: task.title,
     projectName: project.name,
     assignedBy: req.user.name
   })
   ```
6. API responds immediately — job is queued, nothing is blocked
7. The Bull worker process (running separately) picks up the job
8. Worker calls Nodemailer with the email details → Mailtrap receives it in dev
9. If Nodemailer throws an error (network issue, etc.), Bull retries after 1 second, then 5 seconds, then 30 seconds
10. After 3 failures, the job is moved to a "failed" set — visible in Bull Dashboard

---

## Flow 9: Loading the analytics page

1. Owner navigates to /analytics
2. rbacMiddleware on the analytics route confirms the user's role is 'owner' — Members and Viewers get 403
3. Controller checks Redis for key `analytics:${projectId}`
4. **Cache hit**: key exists → return the cached data immediately (~5ms)
5. **Cache miss**: key doesn't exist (first load, or was invalidated)
   - Run MongoDB aggregation pipeline to calculate tasks per member, average completion time, status breakdown
   - This takes ~80ms
   - Store the result in Redis: `redis.setex('analytics:projectId', 300, JSON.stringify(result))` — TTL is 300 seconds (5 minutes)
   - Return the data
6. React receives the analytics data and renders the Recharts charts

Cache invalidation: any time a task is created, updated, or deleted in a project, the controller also calls `redis.del('analytics:${projectId}')` to clear the stale cache. The next analytics load will be a cache miss and will recompute.

---

## Flow 10: CI/CD — pushing code to production

1. You finish a feature on a branch, open a Pull Request on GitHub
2. GitHub Actions workflow triggers automatically on the PR
3. Workflow runs: `npm install` → `npm run lint` → `npm test`
4. If lint fails, the workflow is marked red — you can't merge until it's fixed
5. If all pass, workflow is marked green
6. You merge the PR to main
7. A second GitHub Actions workflow triggers on push to main
8. It calls Render's deploy hook URL — Render pulls the latest code, runs `npm install`, restarts the server
9. It also triggers a Vercel deployment for the frontend
10. Within 2–3 minutes, the live URL is running your new code

---

## Socket.io room management

When a user opens a project page in React, the frontend runs:
```javascript
socket.emit('join:project', { projectId })
```

The server handles this event:
```javascript
socket.on('join:project', ({ projectId }) => {
  socket.join(projectId) // adds this connection to the room named after the project ID
})
```

When any task changes in that project, the server broadcasts to that room:
```javascript
io.to(projectId).emit('task:updated', data)
```

This means only people viewing that specific project receive that event. A user viewing project A doesn't receive events for project B.

When the user navigates away from the project page, React runs:
```javascript
socket.emit('leave:project', { projectId })
```

This removes them from the room.

---

## Error handling

Every route handler is wrapped in a try-catch. Errors are passed to Express's error handling middleware:

```
route handler throws error
→ Express catches it
→ error middleware runs
→ if it's a known error type (validation, not found, unauthorized): return the appropriate HTTP status with a clear message
→ if it's an unknown error: log it, report to Sentry, return 500 Internal Server Error
→ never leak stack traces or internal details to the client
```

The frontend has a global Axios error interceptor that catches API errors and shows a toast notification to the user.
