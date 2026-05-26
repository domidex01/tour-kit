---
"@tour-kit/checklists": patch
---

Checklist accessibility fixes. `ChecklistLauncher`'s `role="dialog"` panel now
has an accessible name — it links to the checklist heading via `aria-labelledby`
(the heading gets a matching `id`, exposed through a new optional `titleId` prop
on `Checklist`). Task completion is now exposed as a toggle: the per-task control
is a `role="checkbox"` with `aria-checked` reflecting completion, instead of a
plain `role="button"` whose state was only conveyed by its label.
