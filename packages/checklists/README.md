# @tour-kit/checklists

> React onboarding checklists with task dependencies, progress tracking & persistence — for getting-started flows and activation.

[![npm version](https://img.shields.io/npm/v/@tour-kit/checklists.svg)](https://www.npmjs.com/package/@tour-kit/checklists)
[![npm downloads](https://img.shields.io/npm/dm/@tour-kit/checklists.svg)](https://www.npmjs.com/package/@tour-kit/checklists)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tour-kit/checklists?label=gzip)](https://bundlephobia.com/package/@tour-kit/checklists)
[![types](https://img.shields.io/npm/types/@tour-kit/checklists.svg)](https://www.npmjs.com/package/@tour-kit/checklists)

Drop-in **onboarding checklists**, **getting-started panels**, **activation funnels**, and **setup wizards** for React. Tasks support dependencies (one unlocks the next), progress tracking, completion conditions, and headless render-prop variants.

> **Pro tier** — requires a license key. See [Licensing](https://usertourkit.com/docs/licensing).

**Alternative to:** [Appcues](https://www.appcues.com/) checklists, [Userpilot](https://userpilot.com/) checklists, [Userflow](https://userflow.com/), [Stripe](https://stripe.com/)-style activation lists, hand-rolled task panels.

## Features

- **Task dependencies** — auto-locks tasks until prerequisites complete
- **Progress tracking** — `{ completed, total, percentage }` per checklist + aggregate hooks
- **Completion conditions** — `manual`, `event` (listen to custom events), or `custom` (predicate)
- **Conditional visibility** — `when()` predicate to hide tasks dynamically
- **Persistence** — survives reload via storage adapter
- **Headless variants** — `ChecklistHeadless`, `TaskHeadless` for full UI control
- **Cycle detection** — `hasCircularDependency()` catches bad configs
- **TypeScript-first**, supports React 18 & 19

## Installation

```bash
npm install @tour-kit/checklists @tour-kit/license
# or
pnpm add @tour-kit/checklists @tour-kit/license
```

## Quick Start

```tsx
import { LicenseProvider } from '@tour-kit/license'
import {
  ChecklistProvider,
  Checklist,
  ChecklistTask,
  ChecklistProgress,
  ChecklistPanel,
  createChecklist,
  createTask,
} from '@tour-kit/checklists'

const onboarding = createChecklist({
  id: 'onboarding',
  title: 'Get started',
  tasks: [
    createTask({ id: 'profile', title: 'Complete your profile' }),
    createTask({ id: 'invite', title: 'Invite a teammate', dependencies: ['profile'] }),
    createTask({ id: 'project', title: 'Create your first project' }),
  ],
})

function App() {
  return (
    <LicenseProvider licenseKey={process.env.NEXT_PUBLIC_TOURKIT_LICENSE!}>
      <ChecklistProvider checklists={[onboarding]}>
        <ChecklistPanel checklistId="onboarding">
          <ChecklistProgress />
          <Checklist>
            <ChecklistTask taskId="profile" />
            <ChecklistTask taskId="invite" />
            <ChecklistTask taskId="project" />
          </Checklist>
        </ChecklistPanel>
      </ChecklistProvider>
    </LicenseProvider>
  )
}
```

Mark tasks complete from anywhere:

```tsx
import { useTask } from '@tour-kit/checklists'

function ProfileForm() {
  const { complete, isCompleted } = useTask('profile')

  const handleSubmit = async () => {
    await saveProfile()
    complete()
  }

  return <form onSubmit={handleSubmit}>{/* ... */}</form>
}
```

## i18n & interpolation

All user-facing strings in `@tour-kit/checklists` accept the `{{var | fallback}}` interpolation grammar from `@tour-kit/core`. Wrap your tree in `<LocaleProvider>` and every task title and description resolves automatically.

```tsx
import { LocaleProvider } from '@tour-kit/core'
import { ChecklistProvider, ChecklistTask, createTask } from '@tour-kit/checklists'

const greet = createTask({
  id: 'greet',
  title: { key: 'task.greet' },
  description: 'Welcome {{user.name | aboard}}!',
})

<LocaleProvider locale="en" messages={{ 'task.greet': 'Say hi to {{user.name | the team}}' }}>
  <ChecklistProvider checklists={[{ id: 'onboarding', tasks: [greet] }]}>
    <ChecklistTask taskId="greet" />
  </ChecklistProvider>
</LocaleProvider>
```

> Full guide: https://usertourkit.com/docs/guides/i18n

## Headless variant

```tsx
import { ChecklistHeadless } from '@tour-kit/checklists'

<ChecklistHeadless checklist={onboarding}>
  {({ tasks, progress, completeTask }) => (
    <div className="custom-ui">
      <progress value={progress.percentage} max={100} />
      {tasks.map((task) => (
        <button
          key={task.id}
          disabled={task.locked}
          onClick={() => completeTask(task.id)}
        >
          {task.completed ? '✓' : '○'} {task.title}
        </button>
      ))}
    </div>
  )}
</ChecklistHeadless>
```

## API Reference

### Components (styled)

| Export | Purpose |
|---|---|
| `ChecklistProvider` | Context provider — registers checklists |
| `ChecklistPanel` | Container with title + collapsible expand |
| `Checklist` | Task list wrapper |
| `ChecklistTask` | Single task row |
| `ChecklistProgress` | Progress bar + percentage |
| `ChecklistLauncher` | Trigger button to open the panel |

### Headless components

```ts
import { ChecklistHeadless, TaskHeadless } from '@tour-kit/checklists'
```

### Hooks

| Hook | Description |
|---|---|
| `useChecklist(id)` | Single checklist state + actions |
| `useTask(taskId)` | Single task state + `complete`, `uncomplete`, `isCompleted`, `locked` |
| `useChecklistPersistence(...)` | State recovery via storage adapter |
| `useChecklistsProgress()` | Aggregate progress across all registered checklists |
| `useChecklistContext()` | Raw context (advanced) |

### Utilities

| Function | Purpose |
|---|---|
| `createChecklist(config)` | Type-safe checklist factory |
| `createTask(config)` | Type-safe task factory |
| `calculateProgress(state)` | `{ completed, total, percentage }` |
| `getNextTask(state)` | First incomplete *and* unlocked task |
| `getLockedTasks(state)` | Tasks blocked by dependencies |
| `canCompleteTask(taskId, state)` | Are deps satisfied? |
| `resolveTaskDependencies(taskId)` | Ordered dep list — **throws** on cycle |
| `hasCircularDependency(tasks)` | Silent boolean check |

### Slot & UI library

```ts
import {
  Slot, Slottable, UnifiedSlot,
  UILibraryProvider, useUILibrary,
} from '@tour-kit/checklists'
```

### Types

```ts
import type {
  ChecklistConfig,
  ChecklistState,
  ChecklistTaskConfig,
  ChecklistTaskState,
  ChecklistProgressType,            // (component shadows the type name)
  ChecklistContextData,
  TaskAction,
  TaskCompletionCondition,          // 'manual' | 'event' | 'custom'
  ChecklistProviderConfig,
  ChecklistPersistenceConfig,
  PersistedChecklistState,
} from '@tour-kit/checklists'
```

## React-free subpath

`@tour-kit/checklists/engine` is the checklists state machine with no React in
it — no `react`, no `react/jsx-runtime`, no `@tour-kit/media`, no
`@tour-kit/analytics`, no `@tour-kit/license`, no `@floating-ui/react`, no
`@radix-ui/react-slot`, in neither the runtime nor the `.d.ts` closure. A Vue,
Svelte or vanilla app runs checklists with none of them installed and renders
the list itself.

```ts
import { createChecklistsEngine, attachUrlVisitTasks } from '@tour-kit/checklists/engine'

const engine = createChecklistsEngine({
  checklists: [{
    id: 'onboarding',
    title: 'Get started',
    tasks: [
      { id: 'profile', title: 'Complete your profile' },
      { id: 'invite', title: 'Invite a teammate', dependsOn: ['profile'] },
    ],
  }],
  persistence: { enabled: true },
})

engine.boot()                                   // resolves storage and hydrates
const detach = attachUrlVisitTasks(engine)      // urlVisit auto-completion

engine.subscribe(() => render(engine.getState()))
engine.completeTask('onboarding', 'profile')    // unlocks `invite`
engine.getProgress('onboarding')                // { completed: 1, total: 2, percentage: 50, remaining: 1 }
```

The constructor touches nothing — no `window`, no storage, no listener — so it
is safe to build on the server and `boot()` on the client. `getState()` is
reference-stable, `subscribe()` fans out synchronously and survives a throwing
subscriber, and `destroy()` is terminal for callbacks as well as state.

`createChecklistsHandle` is the object a binding wraps: lazy construction on
the first verb, reads that never construct, and a `release()` whose destroy is
deferred a microtask so a framework tearing an effect down and re-running it
does not lose the engine's state. Pass `seedChecklistsState(configs)` as its
second argument if you render on a server — no verb runs there, so without a
seed every read answers from the empty snapshot.

Exports: `createChecklistsEngine`, `createChecklistsHandle`,
`initialChecklistsState`, `seedChecklistsState`, `attachUrlVisitTasks`,
`registerUrlVisitTask`, `matchesPattern`, `LOCATION_CHANGE_EVENT`,
`canCompleteTask`, `resolveTaskDependencies`, `hasCircularDependency`,
`calculateProgress`, `getNextTask`, `getLockedTasks`, `createChecklist`,
`createTask`, plus the engine types. The reducer stays internal.

**React-free is not a licence bypass.** `@tour-kit/checklists` is a Pro
package; the `/engine` subpath simply has no React layer for `LicenseGate` to
live in, and using it is subject to the same licence as the rest of the
package.

One caveat, honestly: `@tour-kit/checklists` still hard-depends on
`@tour-kit/media` and `@tour-kit/license`, which list React as a required peer,
so React lands in your `node_modules`. It does **not** land in your bundle:
nothing `/engine` imports reaches it, which
`no-react-in-engine-dist.test.ts` asserts against the built bytes on every run.

## Task completion conditions

```ts
type TaskCompletionCondition = {
  type: 'manual' | 'event' | 'custom'
  eventName?: string             // for 'event' type
  customCheck?: () => boolean    // for 'custom' type
}
```

## Locked vs invisible tasks

- **Locked task** — visible, but cannot complete until dependencies finish. **Counts toward `total`** in progress.
- **Invisible task** — `when()` predicate returned `false`. **Excluded** from `total`.

## Gotchas

- **Circular deps fail differently across APIs.** `createChecklist()` logs an error; `resolveTaskDependencies()` throws; `hasCircularDependency()` is silent. Use the silent check before passing user-built configs.
- **Render order ≠ dependency order.** Tasks render in array order; dependency resolution affects locked state, not display order.
- **`<ChecklistPanel defaultExpanded>`** writes the expanded state once per mount to avoid render loops with context-scoped callbacks.
- **Pair with `<LicenseProvider>`** in production. Dev environments (`localhost`, `127.0.0.1`, `*.local`) bypass the Pro gate.

## Related packages

- [`@tour-kit/react`](https://www.npmjs.com/package/@tour-kit/react) — sequential product tours (link tasks to tours)
- [`@tour-kit/announcements`](https://www.npmjs.com/package/@tour-kit/announcements) — modal / toast / banner announcements
- [`@tour-kit/adoption`](https://www.npmjs.com/package/@tour-kit/adoption) — feature adoption tracking
- [`@tour-kit/analytics`](https://www.npmjs.com/package/@tour-kit/analytics) — track checklist completion events
- [`@tour-kit/license`](https://www.npmjs.com/package/@tour-kit/license) — required Pro license validation

## Documentation

Full documentation: [https://usertourkit.com/docs/checklists](https://usertourkit.com/docs/checklists)

## License

Pro tier — see [LICENSE.md](./LICENSE.md). Requires a Tour Kit Pro license key.
