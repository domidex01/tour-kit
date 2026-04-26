---
title: Queue & frequency rules
type: concept
sources:
  - ../packages/announcements/src/core/priority-queue.ts
  - ../packages/announcements/src/core/scheduler.ts
  - ../packages/announcements/src/core/frequency.ts
  - ../packages/surveys/src/core
updated: 2026-04-26
---

*Two Pro packages share the same patterns: a priority queue with stack-behavior modes, plus a frequency-rules engine that gates when an item can show.*

## Used by

- `@tour-kit/announcements`
- `@tour-kit/surveys`

The implementations live in each package separately (no shared core), but the model is parallel.

## Priority order

```
critical > high > normal > low
```

Configurable via `QueueConfig.priorityOrder`.

## Stack behaviors

| Mode | Behaviour |
|---|---|
| `queue` | Show one at a time; next dequeues when current dismisses |
| `replace` | New item replaces current (current is dismissed with reason `'replaced'`) |
| `stack` | Multiple shown simultaneously up to `maxConcurrent` |

## Frequency rules

```ts
type FrequencyRule =
  | 'once'                              // ever
  | 'session'                           // per browser session (cleared on tab close)
  | 'always'                            // every time conditions match
  | { type: 'times', count: N }         // up to N times total
  | { type: 'interval', days: N }       // every N days
```

Frequency state persists via the package's storage adapter. Cleared on `dismiss()` only when the rule says to.

## Helpers (announcements)

```ts
canShowByFrequency(announcement, history)   → boolean
canShowAfterDismissal(announcement, lastDismissed)  → boolean
getViewLimit(rule)                          → number | Infinity
```

## Surveys: extra fatigue layers

On top of the same queue/frequency model, `@tour-kit/surveys` adds:

| Layer | Description |
|---|---|
| Global cooldown | Minimum days between *any* two surveys (checked first, short-circuits everything) |
| Sampling rate | `0.0–1.0` probability evaluated **once** at provider mount |
| Snooze | User-initiated delay; max snooze count per survey |
| Max per session | Cap on surveys shown in one session |

## Audience targeting (separate but related)

`AudienceCondition` is matched against a `userContext` provided to the package's provider. Common fields: `userId`, `plan`, `signupDate`, `country`. Used to decide *who* sees an item; queue/frequency decides *when*.

## Gotchas

- **Surveys: cooldown short-circuits.** If global cooldown isn't satisfied, no survey shows — individual frequency rules don't even run.
- **Sampling roll happens once.** `samplingRate` is evaluated on mount, not per `show()`. Remount the provider to re-roll.
- **Frequency persistence.** Frequency state is keyed by item ID. Renaming an item ID resets its frequency history.

## Related

- [packages/announcements.md](../packages/announcements.md)
- [packages/surveys.md](../packages/surveys.md)
- [concepts/audience-targeting.md](audience-targeting.md)
- [concepts/storage-adapters.md](storage-adapters.md)
