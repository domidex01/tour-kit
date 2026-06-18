---
"@tour-kit/scheduling": minor
---

Wire business-hours evaluation into the schedule engine. `Schedule` now accepts
an optional `businessHours` field; `isScheduleActive` evaluates it (timezone-aware,
with `businessHours.timezone` taking precedence over the schedule timezone) and
surfaces the `outside_business_hours` status reason. Additive, non-breaking.
dist gz: 3546/4000.
