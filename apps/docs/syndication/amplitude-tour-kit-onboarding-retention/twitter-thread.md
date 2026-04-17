## Thread (6 tweets)

**1/** Most teams track onboarding tour completion rates. That number is basically useless.

What actually matters: does finishing the tour change retention? Here's how to find out with Amplitude behavioral cohorts.

**2/** The setup: wire Tour Kit's 4 callbacks (onTourStart, onStepView, onTourComplete, onTourSkip) to Amplitude's track() API.

About 70 lines of TypeScript. Typed event schema prevents the "inconsistent event names" problem that plagues Amplitude setups.

**3/** Key move: create THREE cohorts, not two.

- Tour completers
- Tour skippers
- Tour unseen (never saw it)

The "unseen" group is your control. Without it, you're comparing motivated users against everyone else.

**4/** Then run Amplitude's Retention Analysis with all three cohorts overlaid.

Calm did this and found 3x higher retention from one onboarding step. They made it mandatory. Retention went up across the board.

**5/** Some data points:
- 20-25% trial-to-paid improvement from data-driven flow redesigns
- Amplitude free tier: 50K MTUs/month
- Amplitude SDK: ~36KB gzipped (vs PostHog 52KB)
- Tour Kit core: <8KB gzipped

**6/** Full tutorial with TypeScript code, funnel setup, cohort creation, and troubleshooting:

https://usertourkit.com/blog/amplitude-tour-kit-onboarding-retention

Also wrote similar guides for PostHog and Mixpanel if you use those instead.
