---
"@tour-kit/checklists": patch
---

Add a 200ms `pending → completing → completed` state machine to `<ChecklistTask>`. While in the `completing` phase the root element gains `data-tk-completing="true"`, which the new optional stylesheet `@tour-kit/checklists/styles/animations.css` uses to apply a strike-through label keyframe and a check-icon scale-pop keyframe. The completion phase is skipped entirely when `useReducedMotion()` returns `true`; the CSS additionally wraps the keyframes in `@media (prefers-reduced-motion: reduce) { animation: none }` for defense-in-depth.
