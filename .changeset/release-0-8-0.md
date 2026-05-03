---
'@tour-kit/adoption': minor
'@tour-kit/ai': minor
'@tour-kit/analytics': minor
'@tour-kit/announcements': minor
'@tour-kit/checklists': minor
'@tour-kit/core': minor
'@tour-kit/hints': minor
'@tour-kit/media': minor
'@tour-kit/react': minor
'@tour-kit/scheduling': minor
'@tour-kit/surveys': minor
---

Unify all packages to 0.8.0 ahead of the 1.0 milestone. Includes a small bug-hunter sweep:

- `@tour-kit/announcements`: clear pending "show next in queue" `setTimeout`s on provider unmount; previously fire-and-forget timers could call `show()` against an unmounted tree.
- `@tour-kit/scheduling`: drop unreachable re-exports (`getCurrentMinutesInTimezone`, `toMinutesSinceMidnight`, `getDateRangeStart`, `getNextTimeRangeStart`, `getNextAllowedDay`) from the inner `utils/` barrel. Symbols remain exported from their source modules where internal callers need them.
- `@tour-kit/react`: silence a `useSemanticElements` warning on `TourProgress` text variant (`<output>` is incompatible with the existing `div`-based prop type).
