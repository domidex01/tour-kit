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
Tasks can have custom completion conditions:
```ts
{
  type: 'manual' | 'event' | 'custom',
  eventName?: string,
  customCheck?: () => boolean
}
```

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
