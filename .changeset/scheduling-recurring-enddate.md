---
"@tour-kit/scheduling": patch
---

Fix `matchesRecurringPattern` end-date handling. The `endDate` of a recurring pattern was compared against UTC midnight, which made the recurrence inactive for the entire final day (except the `00:00Z` instant) and ignored the schedule's timezone. It is now compared as a date-only string in the schedule's timezone, so `endDate` is inclusive of the whole day — matching `isWithinDateRange`.
