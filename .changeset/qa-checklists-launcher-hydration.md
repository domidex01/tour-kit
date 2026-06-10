---
"@tour-kit/checklists": patch
---

Fix an SSR hydration mismatch on the `ChecklistLauncher` `aria-controls` attribute. The panel id is now derived deterministically from the `checklistId` prop instead of `useId()`, so the server and client render the same id even when a client-only branch higher in the tour/provider tree drifts the `useId` counter.
