---
'@tour-kit/scheduling': minor
---

Add `@tour-kit/scheduling/engine`, a React-free subpath exposing every schedule
evaluation function and constant for non-React consumers.

```ts
import { checkSchedule, isWithinBusinessHours } from '@tour-kit/scheduling/engine'
```

The built entry names no bare specifier at all — this package depends on
nothing at runtime — so a Vue, Svelte or Node project can evaluate a schedule
with neither React, `@tour-kit/license` nor `@tour-kit/analytics` installed.
`<ScheduleGate>`, `useSchedule`, `useScheduleStatus` and `useUserTimezone` stay
on the main entry.

No source moved and no behaviour changed; the main entry is byte-for-byte the
same size as before.
