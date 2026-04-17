## Thread (6 tweets)

**1/** Asking "how was the tour?" 2 seconds after completion gets 3-4x higher response rates than an email survey 2 days later.

Here's how we wired Formbricks surveys to fire after Tour Kit tour completion. ~40 lines of TypeScript.

**2/** The integration is simple:
- Tour Kit fires `onComplete` when tour finishes
- Callback calls `formbricks.track('tour_completed')`
- Formbricks checks if a survey matches that action
- Survey appears with tour ID attached as metadata

**3/** Three production gotchas:

1. Formbricks SDK loads async — guard against it not being ready
2. 2-second delay > 0s (jarring) or 5s (user moved on)
3. Handle dismissals separately — 27% of users close tours early (Chameleon data, 15M interactions)

**4/** The open-source angle: both Tour Kit and Formbricks are free to self-host. No recurring SaaS fees for tour + survey tooling.

Formbricks: 11.8K GitHub stars, AGPLv3
Tour Kit: MIT, <8KB gzipped

**5/** When to pick which:
- Formbricks = PMs manage surveys via dashboard
- @tourkit/surveys = devs own everything in code

Both support NPS, CSAT, CES, and fatigue prevention.

**6/** Full tutorial with code examples, edge cases, and comparison table:

https://usertourkit.com/blog/tour-kit-formbricks-in-app-surveys
