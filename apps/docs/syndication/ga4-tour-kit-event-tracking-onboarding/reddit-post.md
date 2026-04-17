## Subreddit: r/reactjs

**Title:** I wrote up how to wire GA4 custom events to a React product tour (with typed events and funnel analysis)

**Body:**

I've been building Tour Kit, a headless product tour library for React. One thing that kept coming up was analytics: people want to know where users drop off during onboarding, but GA4 doesn't have a recommended event type for product tours.

So I wrote a tutorial on wiring Tour Kit's analytics plugin to GA4. The key finding that surprised me: over 60% of GA4 implementations have configuration issues (Tatvic Analytics, 2026), and the most common one with custom events is silent failures. Events stop firing and nobody notices because GA4 doesn't alert you.

The approach: Tour Kit's GA4 plugin maps 6 lifecycle events (tour_started, step_viewed, step_completed, tour_completed, tour_skipped, tour_abandoned) to GA4 custom events automatically. Each gets structured parameters (tour_id, step_index, duration_ms). The whole setup is about 40 lines of TypeScript across 3 files.

Some practical things I covered that I couldn't find elsewhere:
- GA4's 500 event name limit and how parameterized events (one event name + step parameters) prevent burning through it
- Open funnels vs closed funnels for non-linear onboarding (GA4's open funnel feature is underused for this)
- Why GA4 silently truncates parameter values at 100 characters and what to do about it
- The 24-48 hour report processing delay and why DebugView is essential during development

Full article with code examples and a GA4 limits reference table: https://usertourkit.com/blog/ga4-tour-kit-event-tracking-onboarding

Happy to answer questions about the analytics plugin architecture or GA4 gotchas.
