---
title: Focus trap
type: concept
sources:
  - ../packages/core/src/hooks/use-focus-trap.ts
  - ../packages/core/src/utils/dom.ts
  - ../tour-kit/rules/accessibility.md
updated: 2026-04-26
---

*`useFocusTrap()` constrains keyboard focus to a container while it's open. Restores focus to the previously-active element on close.*

## API

```ts
useFocusTrap(options): UseFocusTrapReturn

type UseFocusTrapReturn = {
  containerRef: RefObject<HTMLElement>
  isActive: boolean
  // ...
}
```

Attach `containerRef` to the element you want to trap. The hook handles focus on mount, key events on `Tab` / `Shift+Tab`, and restoration on unmount.

## Behaviour

| Event | Action |
|---|---|
| Mount | Focus moves to first focusable descendant (or container itself) |
| `Tab` on last focusable | Wraps to first |
| `Shift+Tab` on first focusable | Wraps to last |
| Mount-time active element | Saved as `previousActiveElement` |
| Unmount | Focus restored to `previousActiveElement` if it still exists in DOM |

## Determining "focusable"

Uses `getFocusableElements(container)` from `core/utils/dom.ts`. Selector covers:

- Native interactive elements: `a[href]`, `button`, `input`, `select`, `textarea`
- Elements with `tabindex >= 0`
- Excludes `[disabled]`, `[aria-hidden="true"]`, and elements that are visually hidden

## Combining with keyboard nav

Pair with `useKeyboardNavigation` for arrow-key step navigation while focus is trapped. The keyboard hook listens at the container level; the focus trap handles `Tab`.

## Consumers

- `TourCard` (in `@tour-kit/react`)
- `AnnouncementModal`, `AnnouncementSlideout` (in `@tour-kit/announcements`)
- `SurveyModal`, `SurveySlideout` (in `@tour-kit/surveys`)
- `ChecklistPanel` (in `@tour-kit/checklists`)

Hints and toasts deliberately **don't** trap focus — they're non-blocking by design.

## Gotchas

- **Dynamic content.** If new focusable children appear after mount, the trap picks them up (it queries on each Tab press, not just at mount).
- **Portals.** When the trapped container is portaled (e.g. via `TourPortal`), the trap still works because `containerRef` points to the portaled DOM node.
- **Unmount during animation.** Focus restoration uses a ref, not state — it survives re-renders during exit animations.

## Related

- [packages/core.md](../packages/core.md)
- [architecture/accessibility.md](../architecture/accessibility.md)
