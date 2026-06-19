---
"@tour-kit/scheduling": minor
---

Implement `RecurringPattern.maxOccurrences`, which was typed but never enforced. `matchesRecurringPattern` now counts occurrences from `startDate` in the schedule timezone and stops matching once the cap is reached. The count is arithmetic and short-circuits at the cap — no date enumeration — so it stays within the gzip budget.

Remove the unimplemented `ScheduleStatus.nextInactiveAt`: `getScheduleStatus` only ever predicted `nextActiveAt`, so the field promised an active→inactive prediction the runtime never produced. Pre-1.0 breaking type-surface change → minor.
