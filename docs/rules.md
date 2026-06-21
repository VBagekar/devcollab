# DevCollab — Working Rules

Rules we follow so this doesn't turn into a mess halfway through.

---

## How we work together

**One step at a time.** We do not write code for Phase 3 while Phase 1 is unfinished. Each step has a "done" condition in implementation.md. A step is only done when that condition is met — not when the code is written, but when it's been tested and confirmed working.

**You run everything.** I write the code, explain what it does and why, and tell you what to run. You run it. If something doesn't work, you paste the error back to me and we fix it together. You don't skip this step.

**No black boxes.** Before we move to the next step, you should be able to explain what the current step does at a basic level. If you can't, ask — that's what I'm here for. You will get asked "walk me through your auth flow" in interviews. You need to know the answer.

**Commit after every step.** Not after every phase — after every step. Small, frequent commits with good messages. This is what a real commit history looks like. It also means if something breaks, we can always roll back to the last working state.

---

## Code rules

**No copy-pasting without reading.** When I give you code, read it before you run it. I'll explain everything but you should still look at it. If a line is confusing, ask.

**No hardcoded values.** Port numbers, database URLs, JWT secrets, API keys — all go in `.env`. If you find yourself typing a string like `"mongodb://..."` directly in a JS file, stop and move it to the env file.

**No `console.log` left in committed code.** Use console.log during development all you want. Before committing, remove them. Use the logger (morgan for HTTP, a proper logger for app events) instead.

**Async/await everywhere.** No `.then()` chains. Async/await is more readable, easier to debug, and what you should be writing in 2024.

**Error handling is not optional.** Every async function that calls the database or an external service is wrapped in try-catch. We never let unhandled promise rejections crash the server.

**Variable names are descriptive.** `const u = ...` is not allowed. `const user = ...` is. The code should read like English.

---

## Git rules

**Never push directly to main** after the initial setup commits. Always create a branch, work on it, merge via PR (even if you're the only person reviewing).

**Branch names follow a pattern:**
- `feat/` — new feature: `feat/task-drag-drop`
- `fix/` — bug fix: `fix/refresh-token-expiry`
- `chore/` — setup, config, tooling: `chore/add-rate-limiting`
- `docs/` — documentation: `docs/update-readme`

**Commit messages follow conventional commit format:**
- `feat:` — adds new functionality
- `fix:` — fixes a bug
- `chore:` — tooling, configuration, maintenance
- `docs:` — documentation only
- `test:` — adds or updates tests
- `refactor:` — code change that doesn't add a feature or fix a bug

Example: `feat: implement task assignment with email notification`

**One thing per commit.** If you added the Task model AND wrote the task routes, that's two commits:
1. `feat: add Task mongoose model with indexes`
2. `feat: implement task CRUD routes`

**`.env` never gets committed.** `.env.example` always gets committed. Every time you add a new env variable, update `.env.example` immediately.

---

## File structure rules

We do not put everything in one file. Every concern has its own file:
- Models go in `/server/src/models/`
- Route definitions go in `/server/src/routes/`
- Business logic goes in `/server/src/controllers/`
- Middleware goes in `/server/src/middleware/`
- Shared utilities go in `/server/src/utils/`
- Config (DB connection, Redis client) goes in `/server/src/config/`

If a controller file gets longer than ~150 lines, it's a sign that one controller is doing too many things.

---

## What to do when you're stuck

1. Read the error message fully, including the stack trace. Most errors tell you exactly what's wrong and where.
2. Google the exact error message. This is what every engineer does. There is no shame in it.
3. If you've spent 20 minutes and can't figure it out, bring it here with: the error message, what you tried, and what you expected to happen.
4. Never silently skip something because it doesn't work. If a step is broken, we fix it before moving on.

---

## What to update after each session

1. tracker.md — check off completed items, add a session log entry
2. decisions.md section in tracker.md — record any choices made and why
3. .env.example — if you added any new environment variables

---

## What this repo should look like to a recruiter

- Clean, descriptive commit history (not "fix stuff" or "wip")
- A good README that gets straight to the point
- Live URL that loads without errors
- No node_modules, no .env, no build artifacts committed
- Code that's consistent in style (Prettier handles this automatically)
- Tests that actually run and pass
- GitHub Actions showing green checkmarks

The goal: a recruiter or engineer who clones this repo should be able to run it locally in under 10 minutes following only the README instructions.
