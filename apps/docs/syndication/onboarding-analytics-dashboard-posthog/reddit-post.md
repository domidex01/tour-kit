## Subreddit: r/reactjs

**Title:** I built a PostHog dashboard for tracking onboarding tour metrics - here are the 5 numbers worth watching

**Body:**

I've been instrumenting onboarding tours in a Next.js app with PostHog and spent a month figuring out which metrics actually matter vs. which ones just look nice on a slide.

The short version: most teams track tour completion rate and stop there. That's only one of five metrics that tell you whether your onboarding is working. Here's what I ended up tracking weekly:

- **Tour completion rate** (55-75% is healthy, under 40% means something's broken mid-tour)
- **Worst step drop-off** (if any single step loses more than 15% of users, that specific step needs fixing)
- **Median time to complete** (45-90 seconds for a 5-step tour - under 30s means they're clicking through without reading)
- **Activation lift** (do tour completers activate at a 10%+ higher rate than skippers? If not, the tour content itself is the problem)
- **Tour coverage** (what % of new signups even see the tour - we found deploys silently breaking targeting more than once)

The activation lift metric was the most revealing. We had a tour with 70% completion that showed basically zero correlation with activation. High completion, zero impact. The content was pleasant but wasn't teaching anything that led to the aha moment.

The benchmarks come from Appcues' 2025 adoption report, Pendo's PLG data, and our own measurements across three tours over 30 days.

I wrote up the full setup including PostHog funnel configuration, retention panels, and automated alerts: https://usertourkit.com/blog/onboarding-analytics-dashboard-posthog

The instrumentation uses Tour Kit (open-source React tour library I work on) but the dashboard design and metric benchmarks apply regardless of what tour library you're using. Curious if others have found different metrics more useful.
