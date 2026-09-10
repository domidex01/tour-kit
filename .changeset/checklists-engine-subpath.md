---
'@tour-kit/checklists': minor
---

Add `@tour-kit/checklists/engine`, a React-free subpath carrying the checklists
state machine: `createChecklistsEngine`, `createChecklistsHandle`,
`attachUrlVisitTasks`, the dependency graph, progress and persistence. A Vue,
Svelte or vanilla app can now run checklists with React installed nowhere in
its bundle — enforced against the built bytes, in both the runtime and the
declaration closure.

`ChecklistProvider` is now a binding over the engine. Its public API is
unchanged and all 339 existing tests pass untouched.

Two behaviour changes worth knowing about:

- **Fixed:** a `<ChecklistPanel defaultExpanded={false}>` no longer re-expands
  when persisted state loads. Hydration used to hard-code the checklist back to
  expanded, clobbering the panel's own initial state.
- **Changed:** when a task completes its checklist, `checklist_completed` is
  now emitted before `checklist_task_completed`; the order used to be the
  reverse. Both payloads are unchanged. Only code that depends on the relative
  ordering of those two analytics events is affected.
