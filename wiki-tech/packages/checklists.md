---
title: "@tour-kit/checklists"
type: package
package: "@tour-kit/checklists"
version: 0.1.5
sources:
  - ../packages/checklists/CLAUDE.md
  - ../packages/checklists/package.json
  - ../packages/checklists/src/index.ts
updated: 2026-04-26
---

*Interactive onboarding checklists with task dependencies, progress tracking, and dependency-aware locking.*

## Identity

| | |
|---|---|
| Name | `@tour-kit/checklists` |
| Version | 0.1.5 |
| Tier | Pro (license-gated) |
| Deps | `@tour-kit/core`, `@tour-kit/license`, `@floating-ui/react`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Optional peers | `@mui/base` |

## Domain model

| Concept | Meaning |
|---|---|
| **Checklist** | Collection of tasks with shared progress |
| **Task** | One item; may have subtasks, dependencies, completion conditions |
| **Dependency** | "Task B can't complete until task A is done" |
| **Locked** | Task whose dependencies aren't satisfied yet |
| **Visible** | Task whose `when()` predicate returns `true` |

## Public API

### Context & provider

```ts
ChecklistProvider
ChecklistContext, useChecklistContext
ChecklistContextValue
```

### Components (styled)

```ts
Checklist, ChecklistTask, ChecklistProgress, ChecklistLauncher, ChecklistPanel
```

Prop types: `ChecklistProps`, `ChecklistTaskProps`, `ChecklistProgressProps`, `ChecklistLauncherProps`, `ChecklistPanelProps`.

### Headless components

```ts
ChecklistHeadless, TaskHeadless
```

Render-prop API:

```tsx
<ChecklistHeadless checklist={config}>
  {({ tasks, progress, completeTask }) => /* custom UI */}
</ChecklistHeadless>
```

Types: `ChecklistHeadlessProps`, `ChecklistRenderProps`, `TaskHeadlessProps`, `TaskRenderProps`.

### Hooks

```ts
useChecklist(id)              → UseChecklistReturn
useTask(taskId)               → UseTaskReturn
useChecklistPersistence(...)  → UseChecklistPersistenceReturn
useChecklistsProgress()       // aggregate progress across all checklists
```

### Utilities

```ts
createChecklist(config)
createTask(config)

// Progress
calculateProgress(state)      → { completed, total, percentage }
getNextTask(state)            // first incomplete unlocked task
getLockedTasks(state)         // tasks blocked by dependencies

// Dependencies
canCompleteTask(taskId, state)
resolveTaskDependencies(taskId)   // throws on circular dep
hasCircularDependency(tasks)      // silent boolean check
```

### Slot & UI library

```ts
Slot, Slottable, UnifiedSlot, UnifiedSlotProps
UILibraryProvider, useUILibrary, UILibrary, UILibraryProviderProps
```

### Types

```ts
ChecklistConfig, ChecklistState, ChecklistTaskConfig, ChecklistTaskState,
ChecklistProgress, ChecklistContext as ChecklistContextData, TaskAction,
TaskCompletionCondition, ChecklistProviderConfig, ChecklistPersistenceConfig,
PersistedChecklistState
```

(Note: `ChecklistProgress` exported as both component and `ChecklistProgressType` alias.)

## Algorithms

### Dependency resolution (`utils/dependencies.ts`)

- `resolveTaskDependencies(taskId)` — returns ordered list; **throws** on cycle
- `hasCircularDependency(tasks)` — silent boolean; gate programmatic checklist creation with this
- `canCompleteTask(taskId, state)` — boolean: deps satisfied?

### Progress (`utils/progress.ts`)

- `calculateProgress(state)` — `{ completed, total, percentage }`
- `getNextTask(state)` — first incomplete *and* unlocked task
- `getLockedTasks(state)` — locked tasks
- **Locked tasks count toward `total`.** They're still on the user's list. Only invisible tasks (`when()` returns false) are excluded from the denominator.

### Task completion conditions

```ts
type TaskCompletionCondition = {
  type: 'manual' | 'event' | 'custom'
  eventName?: string
  customCheck?: () => boolean
}
```

## Gotchas

- **Circular deps fail differently in different APIs.** `createChecklist()` logs an error; `resolveTaskDependencies()` throws; `hasCircularDependency()` is silent. Use the silent check before passing user-built configs.
- **Render order ≠ dependency order.** Tasks render in config-array order. Dependency resolution affects locked state, not display order.
- **Persistence.** Use `useChecklistPersistence()` for state recovery — it serializes through the provider's storage adapter.

## Related

- [packages/core.md](core.md) — storage adapters, position math
- [packages/license.md](license.md) — gating
- [concepts/storage-adapters.md](../concepts/storage-adapters.md)
