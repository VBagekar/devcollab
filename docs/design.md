# DevCollab — Design Document

## Design philosophy

The UI should look like a real product, not a tutorial project. Clean, neutral, functional. No gradients on everything, no giant hero images, no unnecessary animations. The kind of interface where you can focus on the work — which is appropriate since this is a task management tool.

Reference products to look at before building: Linear, Height, Plane. Note what they have in common: lots of white space, monochrome base with one accent color, clear typographic hierarchy, data-dense but not cluttered.

---

## Color system

All colors are defined as CSS custom properties at the root level. Never hardcode a hex value anywhere else — always use the variable. This way, adding a dark mode later is a one-file change.

```css
:root {
  /* Base */
  --color-bg: #ffffff;
  --color-bg-secondary: #f8f9fa;
  --color-bg-tertiary: #f1f3f5;

  /* Text */
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-muted: #9ca3af;

  /* Borders */
  --color-border: #e5e7eb;
  --color-border-strong: #d1d5db;

  /* Brand (single accent color) */
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-accent-light: #eff6ff;

  /* Semantic */
  --color-success: #16a34a;
  --color-success-light: #f0fdf4;
  --color-warning: #d97706;
  --color-warning-light: #fffbeb;
  --color-danger: #dc2626;
  --color-danger-light: #fef2f2;

  /* Task status */
  --color-todo: #6b7280;
  --color-inprogress: #2563eb;
  --color-done: #16a34a;

  /* Priority */
  --color-priority-low: #6b7280;
  --color-priority-medium: #d97706;
  --color-priority-high: #dc2626;
}
```

---

## Typography

Single font family: **Inter** (from Google Fonts). It's a professional sans-serif designed specifically for UI — readable at small sizes, neutral enough to not distract.

```css
/* Import in index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

body {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-primary);
}
```

Type scale — stick to these and don't invent new ones:
- Page title: 20px, weight 600
- Section heading: 16px, weight 600
- Card title: 14px, weight 500
- Body / labels: 14px, weight 400
- Secondary / metadata: 12px, weight 400, color: text-secondary
- Tiny labels (column headers, chip text): 11px, weight 500, uppercase, letter-spacing 0.05em

---

## Layout

### App shell

Two-column layout:

```
┌─────────────────────────────────────────────────────┐
│                    Top navbar (56px)                │
├────────────┬────────────────────────────────────────┤
│            │                                        │
│  Sidebar   │           Main content                 │
│  (220px)   │                                        │
│            │                                        │
└────────────┴────────────────────────────────────────┘
```

**Top navbar** — DevCollab logo on the left, user avatar + name on the right. Clicking avatar opens a dropdown with Profile and Logout.

**Sidebar** — shows the list of projects the user is a member of. Active project is highlighted. Navigation links at the bottom: Dashboard, Members, Analytics (visible to Owner only), Settings.

**Main content** — everything else. Changes based on which route you're on.

### Kanban board

Three columns of equal width:

```
┌─────────────────────────────────────────────────────────────────┐
│  Todo (4)           In Progress (2)          Done (7)           │
│  ────────────       ────────────────         ──────────         │
│  ┌─────────────┐   ┌─────────────────┐      ┌─────────────┐    │
│  │ Task card   │   │ Task card       │      │ Task card   │    │
│  └─────────────┘   └─────────────────┘      └─────────────┘    │
│  ┌─────────────┐                            ┌─────────────┐    │
│  │ Task card   │                            │ Task card   │    │
│  └─────────────┘                            └─────────────┘    │
│  + Add task                                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Task card design

```
┌─────────────────────────────────┐
│ 🔴 High   • Due Dec 12          │  ← priority dot + due date (red if overdue)
│                                 │
│ Fix authentication bug          │  ← title, 14px weight 500
│                                 │
│ [avatar] Vaishnavi              │  ← assignee
└─────────────────────────────────┘
```

Card: white background, 1px border (#e5e7eb), 8px border-radius, 12px padding. Subtle box-shadow on hover. No shadow at rest.

### Task detail modal

Slides in from the right as a drawer (not a centered popup — drawers are better for content-heavy detail views). Width: 480px on desktop, full-width on mobile.

Sections in the drawer:
1. Title (editable inline — click to edit)
2. Status selector (segmented control: Todo / In Progress / Done)
3. Metadata row: Priority, Assignee, Due date, Created by
4. Description (editable markdown-ish textarea)
5. Divider
6. Comments thread
7. Activity log for this task (collapsible)

---

## Component inventory

These are all the reusable components you'll build. Build them one by one. Never copy-paste UI code — always make a component.

### Primitives (no dependencies on app logic)
- `Button` — variants: primary, secondary, ghost, danger. Sizes: sm, md, lg. Has loading state.
- `Input` — text input with label, error message slot, optional icon left/right
- `Select` — dropdown selector, same props pattern as Input
- `Avatar` — circular user avatar. Shows initials if no image. Sizes: sm (24px), md (32px), lg (40px)
- `Badge` — colored pill. Variants match status and priority colors.
- `Modal` — overlay + centered container. Traps focus, closes on Escape and backdrop click.
- `Drawer` — slides from right. Same close behavior as Modal.
- `Toast` — notification that appears top-right, auto-dismisses after 4 seconds. Variants: success, error, info.
- `Spinner` — loading indicator. Used inside Button and on page loads.
- `Tooltip` — appears on hover, shows label text.
- `Dropdown` — trigger + floating menu. Used for user avatar menu and task action menus.

### Feature components (use app state)
- `KanbanBoard` — contains three `KanbanColumn` components
- `KanbanColumn` — renders column header + list of `TaskCard` components + "Add task" button
- `TaskCard` — the draggable task card
- `TaskDrawer` — the task detail drawer
- `ActivityFeed` — live list of activity log entries
- `MemberList` — table of project members with role badges and remove button
- `InviteModal` — form inside Modal to invite someone
- `AnalyticsPage` — charts and stats
- `ProjectSidebar` — sidebar navigation
- `Navbar` — top bar

---

## Page routes (React Router)

```
/                     → redirect to /dashboard if logged in, else /login
/login                → login page
/register             → register page
/dashboard            → list of all projects
/projects/:id         → kanban board for that project
/projects/:id/members → members management
/projects/:id/activity → activity feed
/projects/:id/analytics → analytics (Owner only)
/settings             → user profile settings
```

---

## Responsive behavior

Minimum supported width: 768px (tablet). The kanban board doesn't work well below that — three columns need space. On mobile, show a list view instead of kanban. This is a stretch goal and not required for the initial build.

Desktop-first, not mobile-first. Build for 1280px+ first.

---

## Empty states

Every list view needs a designed empty state — not a blank page with nothing on it.

- No projects yet: illustration + "Create your first project" button
- No tasks in column: subtle dashed border + "No tasks here" text
- No members yet: "Invite your first team member" prompt
- No activity yet: "Activity will show up here as the team makes changes"

---

## Loading states

Every data-fetching operation has a loading state:
- Page loads: show skeleton loaders (gray placeholder shapes where content will appear) — not a spinner in the middle of the page
- Button actions: show spinner inside the button, disable it, restore after response
- Optimistic updates (like moving a task): update the UI immediately, revert if the API call fails

---

## Forms

All forms use React Hook Form + Zod for validation. Validation runs on submit. Field-level errors appear below the field in red. The submit button is disabled while the form is submitting.

Zod schemas for forms mirror the Zod schemas used on the backend. Define them once in a shared `packages/schemas` folder and import from both.

---

## Animation

Keep it minimal. Only use animation where it adds clarity (not decoration):
- Drawer opens with a 200ms slide-in from the right (`transform: translateX`)
- Toast slides in from top-right, fades out
- Kanban card being dragged: slight scale up (1.02) and box-shadow increase
- Column hover when dragging over it: background color changes to accent-light

No page transition animations. No loading progress bars at the top. No particle effects. No auto-playing anything.
