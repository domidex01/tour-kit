# How to build an onboarding analytics dashboard that actually tells you something

## Most product teams track tour events but never build the dashboard to make sense of them

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-analytics-dashboard-posthog)*

You're firing tour events into PostHog. That's the easy part. The hard part is turning those events into a dashboard that tells you something useful: which tours convert, where users bail, and whether finishing a tour predicts anything about retention.

Most analytics tutorials stop at "call capture() and check the events tab." That leaves you with raw event logs and no structure. What you actually need is a purpose-built dashboard with funnels, retention curves, and cohort breakdowns that answer the questions your product team keeps asking every sprint.

I built that dashboard from scratch using Tour Kit's analytics plugin for PostHog, constructing five panels that cover the onboarding metrics that matter. We tested it in a Next.js 15 app tracking three onboarding tours across 30 days of usage data. Here's what I learned.

## The five panels every onboarding dashboard needs

**1. Completion funnel.** What percentage of users finish the tour? A healthy onboarding funnel converts between 55% and 75%. Below 40% means something in the middle is broken. Above 80% might mean your tour is too short to teach anything.

**2. Step-level drop-off chart.** The funnel gives you the shape. This tells you the specific step where users bail. If one step drops more than 15%, that step needs fixing.

**3. Time-to-complete distribution.** A 5-step tour should complete in 45 to 90 seconds. Under 30 seconds means users click through without reading. Over 120 means it's too complex.

**4. Completion-to-activation correlation.** The panel that answers whether your tours actually work. If tour completers don't activate at a 10%+ higher rate than skippers, the tour content needs rethinking.

**5. Volume alerts.** A dashboard you only check during sprint reviews misses problems for days. Automated alerts catch deploys that accidentally break tour targeting.

## The benchmarks that matter

After running this dashboard for a month, five numbers are worth tracking weekly:

- Tour completion rate: 55-75% is good, under 40% needs work
- Worst step drop-off: under 15% between adjacent steps is healthy
- Median time to complete: 45-90 seconds for a 5-step tour
- Activation lift: 10%+ difference between completers and skippers
- Tour coverage: 85%+ of new signups should see the tour

These benchmarks come from Appcues' 2025 product adoption report, Pendo's State of Product-Led Growth data, and our own measurements.

## The honest tradeoff

Building this dashboard with PostHog gives you full data ownership and customization, but it requires more upfront work than SaaS alternatives. Tools like Appcues and Userpilot include built-in analytics dashboards with zero configuration. If you need a dashboard today and don't want to build one, those are legitimate options.

The tradeoff: their dashboards only show data from tours built in their platform, you pay per monthly active user ($249+/month at scale), and you don't own the raw event data. With PostHog + an open-source tour library, you own everything, but you build everything too.

**Full tutorial with all code examples, PostHog configuration steps, and troubleshooting guide: [usertourkit.com/blog/onboarding-analytics-dashboard-posthog](https://usertourkit.com/blog/onboarding-analytics-dashboard-posthog)**

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Towards Data Science*
