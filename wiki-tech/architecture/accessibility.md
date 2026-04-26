---
title: Accessibility model
type: architecture
sources:
  - ../tour-kit/rules/accessibility.md
  - ../packages/core/src/hooks/use-focus-trap.ts
  - ../packages/core/src/hooks/use-keyboard.ts
  - ../packages/core/src/utils/a11y.ts
updated: 2026-04-26
---

*WCAG 2.1 AA is a project quality gate. Every interactive component must pass focus management, keyboard nav, and live-region semantics out of the box.*

## Quality gates

- WCAG 2.1 AA compliant
- Lighthouse Accessibility score: 100
- All interactive elements: focus visible, keyboard reachable

## Core building blocks (in `@tour-kit/core`)

| Hook / util | Behaviour |
|---|---|
| `useFocusTrap()` | Traps focus within a container; restores on unmount |
| `useKeyboardNavigation()` | Arrow keys, Escape, Enter — configurable via `KeyboardConfig` |
| `announce(text, polite?)` | Inserts an off-screen ARIA live region; cleans up automatically |
| `getStepAnnouncement(step)` | Builds canonical step announcement string |
| `getFocusableElements(container)` | Returns ordered list of focusable descendants |
| `prefersReducedMotion()` | Synchronous check for `(prefers-reduced-motion: reduce)` |
| `usePrefersReducedMotion()` | Reactive hook variant |

## Focus management

- Tour cards trap focus while open via `useFocusTrap`.
- `Tab` cycles focusable elements; `Shift+Tab` reverses.
- On unmount, focus returns to the previously-active element.
- Focus visible styling is **not stripped** anywhere in the styled components.

## Keyboard contract

| Key | Action |
|---|---|
| `Esc` | Close tour / hint / announcement (configurable) |
| `Tab` / `Shift+Tab` | Move focus within the trap |
| `Enter` / `Space` | Activate primary action |
| `→` / `←` | Next / previous step (LTR; mirrored in RTL) |

`KeyboardConfig` lets consumers disable any binding.

## ARIA roles

- Tour card: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`/`aria-describedby` pointing to header/content
- Hints: `role="tooltip"` for popups, `role="button"` for hotspots
- Announcements: variant-specific (`role="alertdialog"` for modal, `role="status"` for toast)

## Reduced motion

- Spotlight, position transitions, and fade animations check `prefers-reduced-motion: reduce` and degrade to instant transitions.
- Media (`@tour-kit/media`) falls back to static poster for autoplay video and animated GIFs.

## RTL support

Core ships:

- `getDocumentDirection()` — reads `dir` attribute on `<html>`
- `mirrorSide`, `mirrorAlignment`, `mirrorPlacementForRTL` — mirror placements automatically
- `useDirection()` hook — reactive direction value

Applies to position calculations, keyboard arrows, and animation directions.

## Related

- [packages/core.md](../packages/core.md)
- [concepts/focus-trap.md](../concepts/focus-trap.md)
