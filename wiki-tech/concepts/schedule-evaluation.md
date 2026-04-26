---
title: Schedule evaluation
type: concept
sources:
  - ../packages/scheduling/src/utils/is-schedule-active.ts
  - ../packages/scheduling/src/utils/get-schedule-status.ts
  - ../packages/scheduling/CLAUDE.md
updated: 2026-04-26
---

*Decide whether a `Schedule` is active "right now" by walking 6 ordered checks. Used by `@tour-kit/scheduling`'s `ScheduleGate`, `useSchedule`, and `useScheduleStatus`.*

## Evaluation order

```
1. Within startAt / endAt date range?     — if no, INACTIVE (out_of_range)
2. In a blackout period?                   — if yes, INACTIVE (blackout)
3. Day of week allowed?                    — if no, INACTIVE (day_not_allowed)
4. Within timeRange (time of day)?         — if no, INACTIVE (outside_time_range)
5. Within business hours (if enabled)?     — if no, INACTIVE (outside_business_hours)
6. Matches recurringPattern (if defined)?  — if no, INACTIVE (recurring_mismatch)
```

If all six pass → **active**.

## API

```ts
checkSchedule(schedule, options?)         → ScheduleResult
isScheduleActive(schedule, options?)      → boolean
getScheduleStatus(schedule, options?)     → ScheduleStatus  // includes inactive reason
```

`ScheduleResult` carries the reason; `ScheduleStatus` adds reactive metadata for hook consumers.

## Timezone handling

| Behaviour | |
|---|---|
| Default evaluation timezone | `schedule.timezone` |
| `useUserTimezone: true` | Auto-detects from browser via `Intl.DateTimeFormat().resolvedOptions().timeZone` |
| Invalid timezone | Falls back to **UTC** |
| DST transitions | Handled automatically |

## Blackout priority

Blackouts override **all** other rules. If you're in a blackout, day-of-week / time-of-day / business-hours / recurring-pattern checks don't matter.

## Business hours vs time-of-day

Both can be enabled simultaneously and are checked independently — both must pass.

## Recurring + endAt interaction

A `recurringPattern` can extend indefinitely. `endAt` overrides — recurrence stops at `endAt` even if the pattern says otherwise.

## React hooks

```ts
useSchedule(schedule)              → { isActive, ... }
useScheduleStatus(schedule, opts)  → { status, reason, nextChange, ... }
```

`useScheduleStatus` auto-refreshes at the next state-change boundary (e.g. when business hours start/end). Configure interval via `opts.refreshInterval`.

## Related

- [packages/scheduling.md](../packages/scheduling.md)
- [packages/announcements.md](../packages/announcements.md)
- [packages/surveys.md](../packages/surveys.md)
