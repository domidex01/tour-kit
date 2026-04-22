---
'@tour-kit/core': minor
'@tour-kit/react': minor
'@tour-kit/hints': minor
---

Wire `autoStart` through to `TourProvider`. Any tour declared with `autoStart: true`
now activates on provider mount, matching the documented quick-start behavior.
Persistence restore still wins — if a tour was previously interrupted, that tour
resumes instead.
