## Thread (6 tweets)

**1/** Userpilot Growth plan: $8,500/year. Most teams already pay for PostHog or Amplitude for analytics. You're paying twice for the same event data. Here's how to fix that. 🧵

**2/** We wrote a migration guide: Userpilot → Tour Kit (headless React tours, <8KB) + PostHog (analytics). The key: run both side-by-side during transition. Zero downtime. Budget 3-5 hours for 2-3 tours.

**3/** The concept mapping is interesting. Userpilot's flows → Tour Kit's <Tour> + <TourStep>. Their analytics → PostHog capture(). Their segmentation → PostHog feature flags. The `userpilot.reload()` SPA hack? Not needed — Tour Kit uses React context.

**4/** Honest tradeoff: you lose Userpilot's visual flow builder. Every tour change requires a React dev. If your PM team ships tours independently, that's a real regression. Not every team should migrate.

**5/** Cost breakdown:
- Userpilot Starter: $3,588/year
- Userpilot Growth: ~$8,500/year
- Tour Kit + PostHog: $0-99 one-time
First-year savings: $3,489 to $8,401

**6/** Full guide with TypeScript code, API mapping table, and troubleshooting: https://usertourkit.com/blog/migrate-userpilot-tour-kit-posthog

(We built Tour Kit — bias disclosed, all numbers verifiable against npm/GitHub)
