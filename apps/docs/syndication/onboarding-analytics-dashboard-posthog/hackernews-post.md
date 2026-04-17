## Title: Building an onboarding analytics dashboard with PostHog

## URL: https://usertourkit.com/blog/onboarding-analytics-dashboard-posthog

## Comment to post immediately after:

I spent a month tracking onboarding tour metrics in PostHog and figured out which numbers actually predict user activation vs. which ones just look good in a report.

The most interesting finding: tour completion rate alone is nearly useless. We had a tour with 70% completion that showed zero correlation with activation. Users finished it because it was easy to click through, not because it taught them anything. The metric that actually matters is activation lift: do tour completers activate at a meaningfully higher rate (10%+) than skippers?

The five metrics I ended up tracking weekly: completion rate, worst step drop-off, median time to complete (45-90s is the sweet spot for a 5-step tour), activation lift, and tour coverage (% of new signups who see the tour at all). Benchmarks sourced from Appcues' adoption report and Pendo's PLG data, plus our own measurements.

The article covers the full PostHog dashboard setup including funnel configuration, retention panels, and automated Slack alerts for when metrics drop. The event instrumentation uses Tour Kit's analytics plugin, but the dashboard design applies to any tour implementation sending structured events to PostHog.
