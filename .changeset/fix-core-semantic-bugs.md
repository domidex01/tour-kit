---
'@tour-kit/core': patch
---

Fix six semantic bugs surfaced by the tk-bug-hunter audit:

- `useKeyboardNavigation` now ignores keypresses while focus is in `<select>`, `[contenteditable]`, or `role="textbox"` elements, so rich-text editors (TipTap, Lexical, ProseMirror) no longer trigger tour navigation while the user is typing.
- `getFocusableElements` (used by `useFocusTrap`) no longer drops `position: fixed` descendants; the filter now uses `getComputedStyle` for `display` / `visibility` instead of `offsetParent`, which is null for fixed-positioned elements.
- `createCookieStorage().getItem()` escapes regex metacharacters in cookie keys so tour IDs containing `.`, `-`, `(`, etc. round-trip correctly.
- `lockScroll()` is now ref-counted: nested calls share a single lock, the saved scroll position is captured once, and previous inline body styles are restored on unlock. Fixes the case where a tour card opens a modal that also locks scroll.
- `useRoutePersistence({ syncTabs: true })` now actually reacts to cross-tab `storage` events via a new additive `externalVersion` return field; the `TourProvider` re-runs its restore effect when this value changes. The no-op manual `StorageEvent` dispatch inside `save()` was removed — browsers already fire those on other tabs automatically.
- The `UPDATE_TOURS` reducer shallow-equality-checks the incoming array and skips state updates when tour references are unchanged, preventing unnecessary re-renders when consumers pass `tours` as an inline literal.

Also removes five unused test-utility factories (`createResizeObserverMock`, `createIntersectionObserverMock`, `createMutationObserverMock`, `createTimerTracker`, `createStorageTracker`) from `cleanup-test-utils.ts`.
