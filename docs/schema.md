# DevCollab — Database Schema

## What is a schema?

A schema defines the shape of data you store. In MongoDB with Mongoose, you write a schema in JavaScript that says: "every document in the Users collection must have these fields, with these types, with these constraints." Mongoose enforces this when you create or update documents. If you try to save a User without an email, Mongoose rejects it before it ever touches the database.

MongoDB stores data as "documents" inside "collections." A collection is like a table in SQL. A document is like a row, except it can contain nested objects and arrays — not just flat key-value pairs.

---

## Collection: Users

One document per registered user.

```javascript
{
  _id: ObjectId,               // MongoDB auto-generates this unique ID for every document
  name: String,                // "Vaishnavi Bagekar" — required, trimmed
  email: String,               // "v@example.com" — required, unique, lowercased
  passwordHash: String,        // bcrypt hash of the password — never store the plain password
  avatar: String,              // URL to profile photo — optional, defaults to null
  refreshTokens: [String],     // array of hashed refresh tokens for this user
                               // array because the user might be logged in on multiple devices
  createdAt: Date,             // auto-managed by Mongoose timestamps option
  updatedAt: Date              // auto-managed by Mongoose timestamps option
}
```

**Indexes:**
- `email`: unique index — no two users can have the same email, and lookups by email are fast

**Why store multiple refresh tokens?** If a user logs in on their laptop and their phone, each session gets its own refresh token. If they log out of one device, only that device's refresh token is removed — the other session stays alive.

**Why hash the refresh token?** If the database is ever breached, attackers shouldn't be able to use the raw refresh tokens to impersonate users. We store the hash and compare incoming tokens using the same hash function.

---

## Collection: Projects

One document per project. Contains the members list directly in the project document (embedded array) rather than a separate collection — because you almost always need both the project data and its members list together, and embedding avoids a second database query.

```javascript
{
  _id: ObjectId,
  name: String,                // "Mobile App Redesign" — required, max 100 chars
  description: String,         // optional, max 500 chars
  
  members: [
    {
      userId: ObjectId,        // reference to Users._id
      role: String,            // "owner" | "member" | "viewer"
      joinedAt: Date
    }
  ],
  
  // Derived/cached stats — updated on task mutations
  // (optional optimization: avoids COUNT queries on task list pages)
  taskCounts: {
    todo: Number,
    inProgress: Number,
    done: Number
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `members.userId`: so you can quickly find all projects a specific user is a member of

**Why embed members in the project?** A project rarely has more than 20-30 members. Embedding is efficient at this scale. The alternative (a separate ProjectMembers collection) adds query complexity with no benefit at this size.

---

## Collection: Tasks

One document per task. Tasks reference their project by ID.

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,         // which project this task belongs to — required
  
  title: String,               // "Implement login flow" — required, max 200 chars
  description: String,         // optional, markdown supported, max 2000 chars
  
  status: String,              // "todo" | "in_progress" | "done" — default: "todo"
  priority: String,            // "low" | "medium" | "high" — default: "medium"
  
  assigneeId: ObjectId,        // references Users._id — optional (null = unassigned)
  createdBy: ObjectId,         // references Users._id — the user who created this task
  
  dueDate: Date,               // optional
  
  comments: [
    {
      _id: ObjectId,           // Mongoose gives embedded docs an _id automatically
      userId: ObjectId,        // who wrote the comment
      text: String,            // comment content, max 1000 chars
      createdAt: Date
    }
  ],
  
  // When status changed to "done" — used to calculate avg completion time in analytics
  completedAt: Date,           // null until the task moves to done
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `projectId`: most queries are "give me all tasks for project X" — this index makes them fast
- `projectId + status`: compound index for kanban queries ("give me all tasks in project X with status todo")
- `assigneeId`: for "tasks assigned to me" queries
- `projectId + completedAt`: for analytics queries that filter by completion date range

**Why embed comments in the task?** Same reasoning as members in project — a task rarely has more than 50 comments. Embedding means one query to get a task with all its comments. A separate Comments collection would require a second query.

**What is a compound index?** A single index that covers multiple fields together. The index on `[projectId, status]` means: when you query `{ projectId: X, status: 'todo' }`, MongoDB can satisfy the entire query from the index without scanning documents. Without it, MongoDB finds all tasks with `projectId: X` first, then scans through them to filter by status.

---

## Collection: ActivityLogs

One document per event. Events are written constantly — every task mutation creates an entry here. This collection can grow large, so it has a TTL index that automatically deletes entries older than 90 days.

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,         // which project
  userId: ObjectId,            // who did the action
  
  action: String,              // what happened — see action types below
  
  // What changed — flexible object depending on the action type
  metadata: {
    taskId: ObjectId,          // relevant task (if action is about a task)
    taskTitle: String,         // denormalized title so we don't need a join to display logs
    from: String,              // for moves: what it was before
    to: String,                // for moves: what it is now
    assigneeName: String,      // for assignments
    // etc. — add fields as needed per action type
  },
  
  createdAt: Date
}
```

**Action types:**
- `task:created` — a task was created
- `task:updated` — task title, description, or priority changed
- `task:moved` — status changed (includes from/to in metadata)
- `task:assigned` — assignee changed (includes assigneeName in metadata)
- `task:deleted` — task was deleted
- `task:commented` — a comment was added
- `member:invited` — a new member was added to the project
- `member:removed` — a member was removed
- `member:role_changed` — a member's role was changed

**Indexes:**
- `projectId + createdAt`: for querying recent activity for a project, sorted by time
- `createdAt` with TTL: `{ expireAfterSeconds: 7776000 }` (90 days) — MongoDB automatically deletes old documents. You never write deletion code; MongoDB handles it.

**Why denormalize taskTitle?** Normally you'd look up the task to get its title when displaying a log entry. But if the task was later deleted, that lookup would return nothing. By storing the title at the time the event happened, the activity log always shows what things were called even if they've since changed or been deleted.

---

## Relationships summary

```
User ─────────────────────────── has many Projects (via Project.members[].userId)
User ─────────────────────────── has many Tasks (via Task.assigneeId / Task.createdBy)
Project ──────────────────────── has many Tasks (via Task.projectId)
Project ──────────────────────── has many ActivityLogs (via ActivityLog.projectId)
Task ─────────────────────────── has many Comments (embedded in Task.comments[])
Task ─────────────────────────── has many ActivityLogs (via ActivityLog.metadata.taskId)
```

There are no SQL-style JOIN operations in MongoDB. Instead, you use Mongoose's `populate()` method, which takes the ObjectId stored in a field and fetches the referenced document in a second query. Example:

```javascript
// Without populate: Task has { assigneeId: ObjectId('abc123') }
// With populate: Task has { assigneeId: { _id: ObjectId('abc123'), name: 'Vaishnavi', email: '...' } }
const task = await Task.findById(taskId).populate('assigneeId', 'name email avatar')
```

You don't always populate — only when you need the referenced data. For the kanban board, you populate the assignee so you can show their name and avatar on the card. For the activity feed, you don't need to populate the task because you stored the title in the metadata.

---

## Redis data structures

Redis is not a relational database — it's a key-value store. Every piece of data has a key (a string) and a value. You design your own key naming convention.

**Cache keys used in DevCollab:**

| Key pattern | Value | TTL | Invalidated when |
|---|---|---|---|
| `dashboard:${projectId}` | JSON: project + task counts | 5 min | Any task created/updated/deleted in that project |
| `analytics:${projectId}` | JSON: aggregated analytics data | 5 min | Any task completed/moved in that project |
| `activity:${projectId}:page:1` | JSON: first page of activity feed | 2 min | Any new activity log entry |

**Bull queue keys** (managed automatically by Bull — you don't set these directly):

| Key pattern | Purpose |
|---|---|
| `bull:email-queue:waiting` | Jobs waiting to be processed |
| `bull:email-queue:active` | Jobs currently being processed by a worker |
| `bull:email-queue:completed` | Successfully processed jobs (retained for 24h) |
| `bull:email-queue:failed` | Jobs that failed all retries |

You never interact with these Bull keys directly — they exist so the Bull Dashboard can display them and so Bull can implement its retry logic.
