---
"@tour-kit/core": patch
"@tour-kit/react": patch
---

Fix `TourCard` focus management (WCAG 2.4.3).

`TourCard` declared `aria-modal="true"` but never trapped focus or restored it
on close — keyboard/screen-reader users could Tab into the dimmed background and
were dumped to `<body>` when the tour closed. Root cause: `TourPortal` mounts
its node lazily, so the focus trap's `activate()` ran against a null container
and silently bailed (never capturing the element to restore focus to).

`TourCard` now tracks the portaled node in state so the trap engages once the
card mounts, restores focus to the invoking trigger on close (X and Skip), and
marks the background `inert` for true modal semantics. Crucially, `aria-modal`,
the focus trap, and the inert background are now applied **only to modal steps**
— steps with `interactive: true` (spotlight/branching) stay non-modal so
keyboard users can still reach the highlighted target.

`@tour-kit/core`'s `useFocusTrap` gains an opt-in `{ inertBackground }` option,
pulls drifting focus back into the container, and is idempotent across Strict
Mode double-invocations.
