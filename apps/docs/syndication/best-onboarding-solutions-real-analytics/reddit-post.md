## Subreddit: r/SaaS (secondary: r/reactjs)

**Title:** I compared the analytics dashboards of 5 onboarding tools — most of them show vanity metrics

**Body:**

I spent a week testing Pendo, Userpilot, Appcues, Chameleon, and Tour Kit (our open-source project). Built the same 5-step tour with a feature nudge and NPS survey in each, then looked at what the analytics actually showed.

The thing that surprised me most: most tools default to showing "tours started" and "guide impressions" as headline metrics. Those tell you nothing about retention. A tour that 12,000 people started but only 200 completed isn't working — but 12,000 looks great on a dashboard.

Some actual data I found useful from Chameleon's 15M interaction study: 3-step tours hit 72% completion, 5-step tours drop to 34%. Self-serve tours complete at 123% higher rates than forced ones. That's the kind of data that changes how you design onboarding.

Quick pricing reality check: Pendo runs ~$48K/year, Appcues from $299/month, Userpilot from $249/month. Tour Kit is MIT open source but requires React developers — no drag-and-drop builder.

The biggest gap I noticed: none of the SaaS tools let you own your analytics data. Events go to their dashboard. Tour Kit's approach is different — typed callbacks that pipe to PostHog, Amplitude, or whatever you already run. Tradeoff is you build your own reports.

Full comparison with a side-by-side table, code examples, and pricing breakdown: https://usertourkit.com/blog/best-onboarding-solutions-real-analytics

Happy to answer questions about any of the tools. We obviously built Tour Kit so take that with appropriate skepticism.
