## Thread (6 tweets)

**1/** I spent a month tracking onboarding tour metrics in PostHog.

Tour completion rate alone is nearly useless. Here's the 5 metrics that actually predict user activation:

**2/** 1. Tour completion rate: 55-75% is healthy

But we had a tour with 70% completion and ZERO correlation with activation.

Users clicked through because it was easy, not because they learned anything.

Completion alone doesn't tell you if the tour works.

**3/** 2. Step-level drop-off: which step loses users?

If any single step drops >15%, that step is broken.

Common causes: tooltip covers the target element, step text too long, or the highlighted element hasn't loaded (lazy-loaded components).

**4/** 3. Median time to complete: 45-90s for a 5-step tour

Under 30s = clicking through without reading
Over 120s = steps too complex

The tour with our highest completion rate averaged 62 seconds.

**5/** 4. Activation lift: THE metric that matters

Do completers activate at 10%+ higher rate than skippers?

If not, the tour content is the problem, not the UX.

5. Tour coverage: 85%+ of new signups should see the tour. Deploys silently break targeting more than you'd expect.

**6/** Full tutorial with PostHog dashboard setup, funnel config, retention panels, and automated alerts:

https://usertourkit.com/blog/onboarding-analytics-dashboard-posthog

Benchmarks from Appcues + Pendo data. Code uses @tourkit analytics plugin but the metrics apply to any tour setup.
