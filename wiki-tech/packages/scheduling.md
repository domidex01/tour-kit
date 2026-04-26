---
title: "@tour-kit/scheduling"
type: package
package: "@tour-kit/scheduling"
version: 0.1.4
sources:
  - ../packages/scheduling/CLAUDE.md
  - ../packages/scheduling/package.json
  - ../packages/scheduling/src/index.ts
updated: 2026-04-26
---

*Time-based scheduling utilities. Decide whether a tour, announcement, or survey is currently active given date ranges, time-of-day, day-of-week, business hours, blackouts, and recurring patterns.*

## Identity

| | |
|---|---|
| Name | `@tour-kit/scheduling` |
| Version | 0.1.4 |
| Tier | Pro (license-gated) |
| Deps | `@tour-kit/license` |
| Peer | `react` |

Standalone — no `@tour-kit/core` dependency. Other packages (`@tour-kit/announcements`, `@tour-kit/surveys`) depend on it as an **optional peer**, so it's only installed when actually used.

## Public API

### Component

```ts
ScheduleGate            // wraps children; only renders when schedule is active
```

### Main evaluation functions

```ts
checkSchedule(schedule, options?)        → ScheduleResult
isScheduleActive(schedule, options?)     → boolean
getScheduleStatus(schedule, options?)    → ScheduleStatus  // includes inactive reason
```

### Timezone utilities

```ts
formatDateString, getDateInTimezone, getUserTimezone,
isValidTimezone, parseDateString, parseTimeString
```

### Date / time / day utilities

```ts
isWithinDateRange
isWithinTimeRange, isWithinAnyTimeRange
DAY_GROUPS, getDayOfWeek, isAllowedDay, dayNameToNumber, dayNumberToName
```

### Blackout utilities

```ts
isInBlackoutPeriod, isInAnyBlackout, getCurrentBlackout, getBlackoutEndTime
```

### Business hours utilities

```ts
isWithinBusinessHours, isHoliday, getDayBusinessHours
BUSINESS_HOURS_PRESETS    // common patterns (9-5, 24/7, etc.)
DAY_NAMES                 // ['sunday', 'monday', ...]
```

### Recurring patterns

```ts
matchesRecurringPattern(pattern, date)
```

### React hooks

```ts
useUserTimezone()                                          // detect once
useSchedule(schedule)              → UseScheduleReturn    // reactive isActive
useScheduleStatus(schedule, opts)  → UseScheduleStatusReturn  // with auto-refresh
```

Types: `UseScheduleOptions`, `UseScheduleReturn`, `UseScheduleStatusOptions`, `UseScheduleStatusReturn`.

### Types

```ts
Schedule, ScheduleEvaluationOptions, ScheduleInactiveReason, ScheduleResult, ScheduleStatus
DateRange, DateString, TimeRange, TimeString
BlackoutPeriod
BusinessHours, BusinessHoursMap, BusinessHoursPreset, DayHours
DayName, DayOfWeek
RecurringPattern
```

## Schedule evaluation order

1. Within `startAt`/`endAt` date range?
2. In a blackout period? (any blackout overrides everything else)
3. Day of week allowed?
4. Within `timeRange` time-of-day?
5. Within business hours (if enabled)?
6. Matches recurring pattern (if defined)?

If all checks pass → schedule is **active**.

## Timezone handling

- All evaluation happens in the schedule's timezone.
- `useUserTimezone: true` auto-detects from the browser via `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- Invalid timezone falls back to **UTC**.
- DST transitions are handled automatically.

## Gotchas

- **ISO strings vs `Date` objects.** Both accepted. ISO strings preserve timezone intent; `Date` instances are interpreted in the schedule's timezone.
- **Recurring + endAt.** Recurrence stops at `endAt` even if the pattern would continue.
- **Blackouts are absolute.** They override day-of-week, business hours, and time-of-day rules.
- **Business hours and time-of-day are independent.** You can use both simultaneously — both must pass.

## Related

- [packages/announcements.md](announcements.md) — optional peer consumer
- [packages/surveys.md](surveys.md) — optional peer consumer
- [packages/license.md](license.md) — gating
- [concepts/schedule-evaluation.md](../concepts/schedule-evaluation.md)
