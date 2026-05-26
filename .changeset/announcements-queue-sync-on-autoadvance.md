---
"@tour-kit/announcements": patch
---

Fix two related queue bugs in the dismiss/complete auto-advance:

- `useAnnouncementQueue().queue` (and `.size`) over-reported by one. `scheduler.getNext()` dequeues the promoted item, but the auto-advance timer set `state.queue` *before* calling `getNext()`, leaving the now-visible announcement still listed until the next queue mutation. The timer now re-syncs `state.queue` from the scheduler after `getNext()`, mirroring `showNext()`.
- Completion is now terminal in `scheduler.canShow()`: a completed announcement no longer re-shows until `reset()` clears `completedAt`. Previously `canShow` gated on `isDismissed` but ignored `completedAt`, so completing an announcement whose frequency permits re-show (e.g. `'always'`, the default) let the auto-show effect immediately re-display it. `forceShow()` still bypasses the gate by design.
