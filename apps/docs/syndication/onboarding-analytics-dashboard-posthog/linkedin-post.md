Tour completion rate is the vanity metric of onboarding analytics.

We tracked three onboarding tours in PostHog for 30 days and found that a 70% completion rate can mean absolutely nothing for activation. Users clicked through because the tour was easy to dismiss, not because they learned anything.

The metric that actually matters: activation lift. Do tour completers activate at a 10%+ higher rate than skippers? If not, the tour content is the problem.

Five numbers worth tracking weekly:
- Completion rate (55-75% healthy)
- Worst step drop-off (< 15% between steps)
- Median time to complete (45-90s for 5 steps)
- Activation lift (> 10% delta)
- Tour coverage (85%+ of signups see it)

Built the full PostHog dashboard setup with automated alerts. When a deploy silently breaks your tour targeting, you want to know the same day, not during the next sprint review.

Full tutorial: https://usertourkit.com/blog/onboarding-analytics-dashboard-posthog

#react #posthog #analytics #productdevelopment #onboarding #opensource
