# Onboarding Checklists Landing Page

**URL:** `/onboarding-checklists`
**Goal:** Convert developers building onboarding flows with task-based progress.
**SEO Target:** "react onboarding checklist", "user onboarding progress", "task checklist component"
**Audience:** Product engineers building activation/onboarding funnels.

---

## Section 1: Hero

```
+------------------------------------------------------------------------+
|  [Logo]  Docs   Pricing   GitHub   Discord        [Get Started ->]     |
+------------------------------------------------------------------------+
|                                                                        |
|              Onboarding checklists that actually                       |
|              get completed.                                            |
|                                                                        |
|         Interactive task lists with dependencies, progress             |
|         tracking, and auto-completion. Built for React.               |
|                                                                        |
|         [Get Started]              [See Demo]                          |
|                                                                        |
|   +-----------------------------------------------------+            |
|   |  Getting Started                          3/5 done   |            |
|   |  ================================================    |            |
|   |  [##########################.............]  60%      |            |
|   |                                                      |            |
|   |  [x] Create your account                             |            |
|   |  [x] Set up your profile                             |            |
|   |  [x] Invite a team member                            |            |
|   |  [ ] Create your first project        [Start ->]     |            |
|   |  [ ] Connect an integration           (locked)       |            |
|   |                                                      |            |
|   +-----------------------------------------------------+            |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 2: Why Checklists Work

```
+------------------------------------------------------------------------+
|                                                                        |
|              The data is clear.                                       |
|                                                                        |
|   +------------------------------------------------------------------+|
|   |                                                                  ||
|   |  Users who complete onboarding are                               ||
|   |                                                                  ||
|   |           +--------+                                             ||
|   |           |  2.6x  |  more likely to convert to paid             ||
|   |           +--------+                                             ||
|   |                                                                  ||
|   |  Source: Userpilot 2024 Onboarding Benchmarks                    ||
|   |  (real, cited stat -- not fabricated)                             ||
|   |                                                                  ||
|   +------------------------------------------------------------------+|
|                                                                        |
|   But most checklist implementations are:                             |
|                                                                        |
|   +------------------+  +------------------+  +------------------+    |
|   |  Hard-coded      |  |  No dependency   |  |  No persistence  |    |
|   |  Can't reorder   |  |  management      |  |  Lost on refresh |    |
|   |  tasks at all    |  |  Steps unlock    |  |  Users start     |    |
|   |                  |  |  in wrong order  |  |  over every time |    |
|   +------------------+  +------------------+  +------------------+    |
|                                                                        |
+------------------------------------------------------------------------+
```

**Copy Notes:**
- Use a REAL stat with citation, or remove it entirely
- Keep the pain points specific and relatable

---

## Section 3: Features

```
+------------------------------------------------------------------------+
|                                                                        |
|              Checklists, done right.                                  |
|                                                                        |
|   +----------------------------------+  +---------------------------+ |
|   |  TASK DEPENDENCIES              |  |                           | |
|   |                                  |  |  Define which tasks must  | |
|   |  [x] Create account             |  |  complete before others   | |
|   |       |                          |  |  unlock. Automatic        | |
|   |       v                          |  |  dependency resolution.   | |
|   |  [x] Set up profile             |  |                           | |
|   |       |                          |  |  dependencies: {          | |
|   |       +------+                   |  |    'invite': ['profile'], | |
|   |       |      |                   |  |    'project': ['profile'] | |
|   |       v      v                   |  |  }                       | |
|   |  [ ] Invite  [ ] Project         |  |                           | |
|   |                                  |  |                           | |
|   +----------------------------------+  +---------------------------+ |
|                                                                        |
|   +----------------------------------+  +---------------------------+ |
|   |  AUTO-COMPLETION                 |  |                           | |
|   |                                  |  |  Tasks auto-complete      | |
|   |  User clicks "Create Project"    |  |  when the user performs   | |
|   |       |                          |  |  the action in your app.  | |
|   |       v                          |  |  No manual checking.      | |
|   |  Tour Kit detects the action     |  |                           | |
|   |       |                          |  |  onComplete: (taskId) =>  | |
|   |       v                          |  |    track(taskId)          | |
|   |  [x] Create Project  <- auto!   |  |                           | |
|   |                                  |  |                           | |
|   +----------------------------------+  +---------------------------+ |
|                                                                        |
|   +----------------------------------+  +---------------------------+ |
|   |  PROGRESS PERSISTENCE            |  |                           | |
|   |                                  |  |  Progress saves to        | |
|   |  Day 1: [##........]  20%       |  |  localStorage, cookies,   | |
|   |  Day 2: [######....]  60%       |  |  or your backend.         | |
|   |  Day 3: [##########] 100%       |  |  Users pick up where      | |
|   |                                  |  |  they left off.           | |
|   |  Refresh? Still there.           |  |                           | |
|   |  New device? Synced.             |  |  storage={customAdapter}  | |
|   |                                  |  |                           | |
|   +----------------------------------+  +---------------------------+ |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 4: Code Example

```
+------------------------------------------------------------------------+
|                                                                        |
|              Add a checklist in minutes.                               |
|                                                                        |
|   +----------------------------------------------------------------+  |
|   |  import { Checklist, ChecklistItem }                           |  |
|   |    from '@tour-kit/checklists'                                 |  |
|   |                                                                |  |
|   |  const tasks = [                                               |  |
|   |    { id: 'profile', title: 'Set up profile',                  |  |
|   |      description: 'Add your name and photo' },                |  |
|   |    { id: 'invite', title: 'Invite teammates',                 |  |
|   |      deps: ['profile'] },                                     |  |
|   |    { id: 'project', title: 'Create project',                  |  |
|   |      deps: ['profile'] },                                     |  |
|   |  ]                                                             |  |
|   |                                                                |  |
|   |  <ChecklistProvider tasks={tasks}>                             |  |
|   |    <Checklist>                                                 |  |
|   |      {tasks.map(t => (                                         |  |
|   |        <ChecklistItem key={t.id} task={t} />                  |  |
|   |      ))}                                                       |  |
|   |    </Checklist>                                                |  |
|   |  </ChecklistProvider>                                          |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
|   [Copy Code]                          [Open in StackBlitz ->]        |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 5: Combine with Tours

**Purpose:** Cross-sell -- checklists + tours work together.

```
+------------------------------------------------------------------------+
|                                                                        |
|              Checklists + Tours = Activation.                         |
|                                                                        |
|   +-----------------------------------------------------+            |
|   |                                                      |            |
|   |  Getting Started               2/4 done              |            |
|   |                                                      |            |
|   |  [x] Create account                                  |            |
|   |  [x] Set up profile                                  |            |
|   |  [ ] Create project   [Start guided tour ->]         |            |
|   |       |                                               |            |
|   |       +-- clicking launches a 3-step tour             |            |
|   |           that walks the user through                 |            |
|   |           project creation                            |            |
|   |                                                      |            |
|   |  [ ] Invite team  (locked until project created)     |            |
|   |                                                      |            |
|   +-----------------------------------------------------+            |
|                                                                        |
|         Each checklist item can trigger a product tour.               |
|         When the tour completes, the task auto-completes.             |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 6: CTA

```
+------------------------------------------------------------------------+
|                                                                        |
|              Build onboarding that converts.                          |
|                                                                        |
|         $ pnpm add @tour-kit/checklists                    [copy]    |
|                                                                        |
|         [Read the Docs]            [View Examples]                    |
|                                                                        |
+------------------------------------------------------------------------+
```
