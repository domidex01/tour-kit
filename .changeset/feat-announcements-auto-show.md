---
'@tour-kit/announcements': minor
---

Registered announcements now auto-show on mount (and when `userContext` changes)
whenever eligibility rules (`frequency`, `audience`, `schedule`, queue capacity)
allow. This closes a behavior gap where configs registered but never surfaced.

Opt out per-announcement with `autoShow: false` to drive the component imperatively
via `show(id)`.
