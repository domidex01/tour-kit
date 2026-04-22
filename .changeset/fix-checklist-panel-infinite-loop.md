---
'@tour-kit/checklists': patch
---

Fix infinite `Maximum update depth exceeded` when mounting `<ChecklistPanel>` inside
`<ChecklistProvider>`. The `defaultExpanded` effect now fires exactly once per mount,
and every reducer action short-circuits when the dispatched value matches current state.
