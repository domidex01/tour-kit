# @tour-kit/scheduling

Time-based scheduling for tours and announcements.

## Key Concepts

### Schedule Evaluation Order
1. Check if within date range (startAt/endAt)
2. Check if in blackout period
3. Check if correct day of week
4. Check if within time of day range
5. Check if within business hours (if enabled)
6. Evaluate recurring pattern (if defined)

### Timezone Handling
- All dates are evaluated in the schedule's timezone
- `useUserTimezone: true` auto-detects from browser
- Falls back to UTC if timezone invalid
- DST transitions handled automatically

## Gotchas

- **ISO strings vs Date**: Both accepted, but ISO strings preserve timezone intent
- **Recurring + endAt**: Recurrence stops at endAt even if pattern continues
- **Blackout priority**: Blackouts override all other rules
- **Business hours**: Independent of time of day (can use both)

## Architecture

```
types/
  schedule.ts       - Schedule, RecurringPattern, TimeRange
  business-hours.ts - BusinessHours, DayHours
  events.ts         - Analytics event types

utils/
  is-schedule-active.ts  - Main evaluation function
  get-schedule-status.ts - Detailed status with reason
  recurring.ts           - Recurring pattern evaluation
  timezone.ts            - Timezone conversion helpers
  blackout.ts            - Blackout checking
  business-hours.ts      - Business hours evaluation

hooks/
  use-schedule.ts        - Reactive schedule state
  use-schedule-status.ts - Status with auto-refresh
```

## Commands

```bash
pnpm --filter @tour-kit/scheduling build
pnpm --filter @tour-kit/scheduling typecheck
pnpm --filter @tour-kit/scheduling test
```

## Related Rules
- `tour-kit/rules/hooks.md` - Hook patterns
- `tour-kit/rules/typescript.md` - Type patterns
