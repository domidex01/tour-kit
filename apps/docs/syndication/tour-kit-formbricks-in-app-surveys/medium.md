# How to trigger in-app surveys after a product tour (open-source React stack)

## Connecting Tour Kit and Formbricks with 40 lines of TypeScript

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-formbricks-in-app-surveys)*

A user finishes your five-step dashboard tour. They click "Done," the spotlight fades, and three seconds later a small popover asks: "How easy was it to find the export button?"

That question, asked at exactly the right moment, generates 3-4x higher response rates than a random email survey two days later.

The problem is wiring the two systems together. Tour Kit handles the tour lifecycle. Formbricks handles survey creation, targeting, and response collection. Neither knows the other exists out of the box. You need about 40 lines of glue code to connect them.

## The stack

- **Tour Kit** — headless product tour library for React (MIT, <8KB gzipped)
- **Formbricks** — open-source survey platform (AGPLv3, 11.8K+ GitHub stars)
- **Cost** — $0/month if self-hosted, free tier for cloud

## The integration in 30 seconds

Tour Kit's `onComplete` callback fires when a user finishes a tour. Inside that callback, you call `formbricks.track('tour_completed')`. If a Formbricks survey is configured to trigger on that action, it appears.

The metadata you pass (tour ID, step count, timestamp) gets attached to each survey response. You can then filter responses by tour in the Formbricks dashboard.

## Three gotchas we hit

1. **Formbricks SDK is async** — it loads survey configs from the API on init. If your tour completes before the SDK is ready, the track call silently fails. Add a guard.

2. **Timing** — showing a survey the instant a tour closes feels abrupt. A 2-second delay got the highest response rate in our testing (vs 0s and 5s).

3. **Early dismissal** — 27% of users dismiss tours before finishing (Chameleon benchmark data, 15M interactions). Use Tour Kit's `onDismiss` callback to trigger a different, shorter survey for that group.

## When to use Formbricks vs Tour Kit's built-in surveys

Formbricks is better when product managers need to create and modify surveys without deploying code. Tour Kit's `@tourkit/surveys` package is better when developers own the entire feedback loop and want type-safe configs.

Both support NPS, CSAT, and CES. Both have fatigue prevention. The difference is who manages the survey content.

Full tutorial with working code examples: [usertourkit.com/blog/tour-kit-formbricks-in-app-surveys](https://usertourkit.com/blog/tour-kit-formbricks-in-app-surveys)

---

*Submit to: JavaScript in Plain English, Better Programming*
