---
'@tour-kit/core': minor
---

Publish the DOM behaviours from `@tour-kit/core/engine`: `createFocusTrap`, `attachKeyboard`, `trackRect`, `computeSpotlight`, `bindStepAdvance` / `attachAdvanceOn` / `dispatchAdvanceEvent`, and `attachTestBridge`.

`@tour-kit/core/engine` could already *run* a tour without React; it can now *show* one. A Vue, Svelte or vanilla binding gets focus trapping, keyboard navigation, target tracking through scroll and resize, the spotlight geometry and auto-advance as plain functions it attaches around its own rendering.

Nothing changes for React consumers. `useFocusTrap`, `useKeyboardNavigation`, `useSpotlight`, `useElementPosition` and `useAdvanceOn` keep their exact signatures and behaviour — they are now thin wrappers over the same functions, and all 82 of their existing tests pass unmodified.
