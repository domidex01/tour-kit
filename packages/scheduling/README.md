# @tour-kit/scheduling

> React scheduling hooks with IANA timezones, business hours, blackouts & recurring patterns — show UI on a schedule.

[![npm version](https://img.shields.io/npm/v/@tour-kit/scheduling.svg)](https://www.npmjs.com/package/@tour-kit/scheduling)
[![npm downloads](https://img.shields.io/npm/dm/@tour-kit/scheduling.svg)](https://www.npmjs.com/package/@tour-kit/scheduling)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tour-kit/scheduling?label=gzip)](https://bundlephobia.com/package/@tour-kit/scheduling)
[![types](https://img.shields.io/npm/types/@tour-kit/scheduling.svg)](https://www.npmjs.com/package/@tour-kit/scheduling)

Time-based **scheduling utilities and React hooks** — decide whether a tour, announcement, survey, or any UI is currently active given **date ranges**, **time-of-day**, **day-of-week**, **business hours**, **blackouts**, and **recurring patterns**. Full IANA timezone support with automatic DST handling.

> **Pro tier** — requires a license key. See [Licensing](https://usertourkit.com/docs/licensing).

**Use this for:** time-windowed announcements (release windows), business-hours-only tours, scheduled product walkthroughs, blackout periods (holidays / freezes), recurring weekly nudges.

## Features

- **Standalone** — does not depend on `@tour-kit/core`. Works in any React app
- **`<ScheduleGate>`** component — wraps children, only renders when the schedule is active
- **3 evaluation functions** — `checkSchedule`, `isScheduleActive`, `getScheduleStatus`
- **Reactive hooks** — `useSchedule`, `useScheduleStatus` with auto-refresh
- **IANA timezones** — DST handled automatically; falls back to UTC on invalid input
- **Business hours presets** — 9-to-5, 24/7, weekends-off, common patterns built in
- **Blackout periods** — absolute overrides for holidays / freezes
- **Recurring patterns** — daily, weekly, monthly, custom predicates
- **TypeScript-first**, supports React 18 & 19

## Installation

```bash
npm install @tour-kit/scheduling @tour-kit/license
# or
pnpm add @tour-kit/scheduling @tour-kit/license
```

## Quick Start

```tsx
import { LicenseProvider } from '@tour-kit/license'
import { ScheduleGate } from '@tour-kit/scheduling'

function App() {
  return (
    <LicenseProvider licenseKey={process.env.NEXT_PUBLIC_TOURKIT_LICENSE!}>
      <ScheduleGate
        schedule={{
          startAt: '2026-05-01',
          endAt: '2026-06-01',
          timezone: 'America/Los_Angeles',
          businessHours: {
            preset: '9-to-5-weekdays',
          },
        }}
      >
        <ReleaseAnnouncementBanner />
      </ScheduleGate>
    </LicenseProvider>
  )
}
```

Or imperatively with hooks:

```tsx
import { useSchedule } from '@tour-kit/scheduling'

function ReleaseBanner() {
  const { isActive } = useSchedule({
    startAt: '2026-05-01',
    endAt: '2026-06-01',
    timezone: 'America/Los_Angeles',
  })

  return isActive ? <Banner>v2 launch week!</Banner> : null
}
```

## Schedule evaluation order

1. Within `startAt`/`endAt` date range?
2. In a blackout period? *(any blackout overrides everything else)*
3. Day of week allowed?
4. Within `timeRange` time-of-day?
5. Within business hours (if enabled)?
6. Matches recurring pattern (if defined)?

If all checks pass → schedule is **active**.

## Schedule examples

```ts
// Release window — date range
{ startAt: '2026-05-01', endAt: '2026-06-01' }

// Business hours only — Pacific Time
{
  timezone: 'America/Los_Angeles',
  businessHours: { preset: '9-to-5-weekdays' },
}

// Custom hours — Mon–Thu 10am–4pm
{
  timezone: 'America/New_York',
  daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday'],
  timeRange: { start: '10:00', end: '16:00' },
}

// Blackout (holidays)
{
  startAt: '2026-01-01',
  endAt: '2026-12-31',
  blackouts: [
    { start: '2026-12-24', end: '2026-12-26' },
    { start: '2026-07-04', end: '2026-07-04' },
  ],
}

// Recurring — every Monday morning
{
  timezone: 'UTC',
  recurringPattern: { type: 'weekly', daysOfWeek: ['monday'] },
  timeRange: { start: '09:00', end: '12:00' },
}
```

## Integration with announcements & surveys

`@tour-kit/announcements` and `@tour-kit/surveys` accept this package as an **optional peer**. Pass a `schedule` prop and they'll auto-gate:

```tsx
<AnnouncementsProvider
  announcements={[
    {
      id: 'launch',
      variant: 'banner',
      title: 'Launch week!',
      schedule: { startAt: '2026-05-01', endAt: '2026-05-08' },
    },
  ]}
>
  <AnnouncementBanner id="launch" />
</AnnouncementsProvider>
```

## API Reference

### Component

```ts
import { ScheduleGate } from '@tour-kit/scheduling'
```

### Evaluation functions

| Function | Returns |
|---|---|
| `checkSchedule(schedule, options?)` | `ScheduleResult` — full evaluation result |
| `isScheduleActive(schedule, options?)` | `boolean` |
| `getScheduleStatus(schedule, options?)` | `ScheduleStatus` — includes inactive reason |

### Hooks

| Hook | Description |
|---|---|
| `useSchedule(schedule, opts?)` | Reactive `isActive` |
| `useScheduleStatus(schedule, opts?)` | Reactive status + reason, with auto-refresh |
| `useUserTimezone()` | Detect browser timezone once |

### Timezone utilities

```ts
import {
  formatDateString,
  getDateInTimezone,
  getUserTimezone,
  isValidTimezone,
  parseDateString,
  parseTimeString,
} from '@tour-kit/scheduling'
```

### Date / time / day utilities

```ts
import {
  isWithinDateRange,
  isWithinTimeRange,
  isWithinAnyTimeRange,
  DAY_GROUPS,
  getDayOfWeek,
  isAllowedDay,
  dayNameToNumber,
  dayNumberToName,
} from '@tour-kit/scheduling'
```

### Blackout utilities

```ts
import {
  isInBlackoutPeriod,
  isInAnyBlackout,
  getCurrentBlackout,
  getBlackoutEndTime,
} from '@tour-kit/scheduling'
```

### Business hours utilities

```ts
import {
  isWithinBusinessHours,
  isHoliday,
  getDayBusinessHours,
  BUSINESS_HOURS_PRESETS,    // common patterns: 9-to-5, 24/7, etc.
  DAY_NAMES,                  // ['sunday', 'monday', ...]
} from '@tour-kit/scheduling'
```

### Recurring patterns

```ts
import { matchesRecurringPattern } from '@tour-kit/scheduling'
```

### Types

```ts
import type {
  Schedule,
  ScheduleEvaluationOptions,
  ScheduleInactiveReason,
  ScheduleResult,
  ScheduleStatus,
  DateRange,
  DateString,
  TimeRange,
  TimeString,
  BlackoutPeriod,
  BusinessHours,
  BusinessHoursMap,
  BusinessHoursPreset,
  DayHours,
  DayName,
  DayOfWeek,
  RecurringPattern,
  UseScheduleOptions,
  UseScheduleReturn,
  UseScheduleStatusOptions,
  UseScheduleStatusReturn,
} from '@tour-kit/scheduling'
```

## Gotchas

- **ISO strings vs `Date` objects** — both accepted. ISO strings preserve timezone intent; `Date` instances are interpreted in the schedule's timezone.
- **Recurring + endAt** — recurrence stops at `endAt` even if the pattern would continue.
- **Blackouts are absolute** — they override day-of-week, business hours, and time-of-day rules.
- **Business hours and time-of-day are independent** — you can use both; both must pass.
- **Invalid timezone falls back to UTC** — `isValidTimezone()` to validate before passing.

## Related packages

- [`@tour-kit/announcements`](https://www.npmjs.com/package/@tour-kit/announcements) — accepts `@tour-kit/scheduling` as optional peer
- [`@tour-kit/surveys`](https://www.npmjs.com/package/@tour-kit/surveys) — same
- [`@tour-kit/license`](https://www.npmjs.com/package/@tour-kit/license) — required Pro license validation

## Documentation

Full documentation: [https://usertourkit.com/docs/scheduling](https://usertourkit.com/docs/scheduling)

## License

Pro tier — see [LICENSE.md](./LICENSE.md). Requires a Tour Kit Pro license key.
