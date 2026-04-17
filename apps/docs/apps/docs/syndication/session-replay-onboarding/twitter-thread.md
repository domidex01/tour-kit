## Thread (6 tweets)

**1/** Your onboarding funnel says 40% drop off at step 3. But WHY?

Session replay answers that question. Here's how to wire it into your product tour analytics:

**2/** The key insight: instrument your tour with lifecycle events (step viewed, completed, dismissed), then use those as replay filters.

In PostHog: click a funnel drop-off bar, and it shows the exact sessions that abandoned.

Watching 10 filtered sessions/week reveals 2-3 recurring friction points.

**3/** SDK bundle sizes vary 15x across tools:

- Sentry: 29 KB gzipped
- PostHog: 52.4 KB
- FullStory: 58.8 KB
- Contentsquare: 553 KB

That matters when your onboarding page already loads a tour library + your app.

**4/** Privacy is non-trivial.

GDPR fines: up to 20M EUR. US wiretapping lawsuits against replay users are increasing.

Modern SDKs mask PII by default, but onboarding inputs (workspace names, role selections) need explicit masking.

Consent before recording. Always.

**5/** The best pattern: lazy-load replay only for new users.

Returning users who completed onboarding don't need recording. This cuts the bundle impact to zero for most sessions.

**6/** Full guide with React code examples, tool comparison table, privacy checklist, and a structured weekly workflow for replay review:

https://usertourkit.com/blog/session-replay-onboarding
