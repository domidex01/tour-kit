# @tour-kit/checklists

Interactive checklists with task dependencies.

## Domain Concepts

- **Checklist**: A collection of tasks with shared state
- **Task**: An item that can be completed (may have subtasks)
- **Dependencies**: Tasks can depend on other tasks
- **Progress**: Calculated from completed vs total tasks

## Key Algorithms

### Dependency Resolution
Located in `utils/dependencies.ts`:

- `resolveTaskDependencies(taskId)` - Returns ordered list of deps
- `hasCircularDependency(tasks)` - Detects cycles (throws if found)
- `canCompleteTask(taskId, state)` - Checks if deps are satisfied

**Gotcha**: Always call `hasCircularDependency()` when creating checklists programmatically.

### Progress Calculation
Located in `utils/progress.ts`:

- `calculateProgress(state)` - Returns `{ completed, total, percentage }`
- `getNextTask(state)` - Returns first incomplete, unlocked task
- `getLockedTasks(state)` - Returns tasks blocked by dependencies

**Gotcha**: Locked tasks *do* count toward total — they're still part of the user's to-do list. Only invisible tasks (`when()` returns `false`) are excluded.

### Completion Conditions
`TaskCompletionCondition` is a four-arm union — declared in
`lib/checklists-engine/types.ts`, re-exported from `types/checklist.ts`:
```ts
type TaskCompletionCondition =
  | { tourCompleted: string }
  | { tourStarted: string }
  | { custom: (context: ChecklistContextData) => boolean }
  | { type: 'urlVisit'; urlPattern: string | RegExp }
```
Be honest about what runs: only the `urlVisit` arm is evaluated today, by
`attachUrlVisitTasks` (`lib/checklists-engine/url-visit-tasks.ts`). The other
three arms are typed and accepted but nothing reads them — a task carrying
`{ tourCompleted: 'x' }` will never auto-complete. Either implement or delete
them in a dedicated slice; do not describe them as working.

Separately, `manualComplete` is a different thing and does work: it defaults to
true and `executeAction` skips the auto-completion when it is `false`.

### React-free engine (v3 Phase 2)
The state machine lives in `src/lib/checklists-engine/` and is published at
`@tour-kit/checklists/engine`. Ten modules: `types`, `reducer`, `persistence`,
`dependencies`, `progress`, `create-checklist`, `create-checklists-engine`,
`handle`, `url-visit-listener`, `url-visit-tasks`.

Rules that are enforced, not conventions:
- Nothing under `lib/checklists-engine/` may import `react`,
  `@tour-kit/media`, or the package's own `../../types` barrel — that barrel
  reaches `ReactNode` and `MediaSlotProps`, and a TYPE import leaves no trace
  in the built JS, so only the source walk in
  `__tests__/no-react-in-engine-dist.test.ts` catches it.
- Import `@tour-kit/core/engine`, never bare `@tour-kit/core`.
- `engine/index` must stay out of the `injectUseClient([...])` call in
  `tsup.config.ts`.
- `splitting: true` means `dist/engine/index.js` is a re-export shell. Every
  size or scan claim must walk the import CLOSURE; reading the shell (482 B
  against a 12 KB closure) passes forever.

`ChecklistProvider` is a binding over `createChecklistsHandle`. The two seeds
it builds must be the SAME object — the handle's pre-verb snapshot and the
engine's `initialState` — or the construction fan-out looks like a state change
and every consumer renders twice.

## Component Patterns

### Headless Components
```tsx
<ChecklistHeadless checklist={config}>
  {({ tasks, progress, completeTask }) => (
    // Custom rendering
  )}
</ChecklistHeadless>
```

### Styled Components
```tsx
<ChecklistProvider checklists={[config]}>
  <ChecklistPanel checklistId="onboarding">
    <ChecklistProgress />
    <Checklist>
      <ChecklistTask taskId="step-1" />
    </Checklist>
  </ChecklistPanel>
</ChecklistProvider>
```

## Gotchas

- **Circular deps**: `createChecklist()` logs an error; `resolveTaskDependencies()` throws. `hasCircularDependency()` is the silent check — use it to gate programmatic checklist creation.
- **Task ordering**: Tasks render in config order, not dependency order
- **Persistence**: Use `useChecklistPersistence()` for state recovery

## Commands

```bash
pnpm --filter @tour-kit/checklists build
pnpm --filter @tour-kit/checklists typecheck
pnpm --filter @tour-kit/checklists test
```

## Related Rules
- `tour-kit/rules/components.md` - Component patterns
- `tour-kit/rules/testing.md` - Testing standards
