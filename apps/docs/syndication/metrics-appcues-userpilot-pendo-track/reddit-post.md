## Subreddit: r/reactjs (cross-post to r/webdev)

**Title:** I tested the analytics in Appcues, Userpilot, and Pendo — here's what each one actually tracks (and 6 metrics none of them cover)

**Body:**

I spent two weeks digging into the analytics capabilities of three major onboarding tools. Not the feature lists on their marketing pages — the actual dashboards, what queries you can run, and where the data lives.

Quick findings:

- **Appcues** only tracks events inside Appcues-built flows. No funnel builder, no path analysis, no session replay. If you want to know what users did after the tour, you need a separate analytics tool.
- **Userpilot** has decent funnels and cohort analysis, but the dashboard UX gets rough. Multiple G2 reviewers mention it freezing under load.
- **Pendo** is the strongest analytically (autocapture, retroactive queries, AI insights) but costs a median $48K/year per Vendr data. And hourly data refreshes mean your "real-time" dashboard is always behind.

The more interesting finding was 6 metric categories that none of them track:

1. Survey fatigue accumulation across a user's lifecycle
2. Timing-aware delivery analytics (when users need help vs when they get it)
3. Cross-mechanism correlation (did the checklist or the announcement drive adoption?)
4. Complete HEART framework mapping
5. Full AARRR metrics (Referral and Revenue are missing in all three)
6. Their own performance impact on your app (bundle size, Core Web Vitals)

I put together a full comparison table and code examples for a code-owned analytics alternative. For those who already run PostHog/Mixpanel/Amplitude, it might be simpler to pipe 10 custom events from your onboarding code than pay for a second analytics layer.

Full breakdown with the comparison table: https://usertourkit.com/blog/metrics-appcues-userpilot-pendo-track

Disclosure: I maintain an open-source onboarding library (User Tour Kit), so I'm biased toward the code-owned approach. Happy to answer questions about any of the tools.
