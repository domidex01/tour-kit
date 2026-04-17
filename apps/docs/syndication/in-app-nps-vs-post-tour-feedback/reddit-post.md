## Subreddit: r/reactjs

**Title:** I wrote up a guide on when to trigger NPS vs CSAT vs CES relative to product tours — the timing matters more than I expected

**Body:**

I've been working on survey timing for onboarding flows and wanted to share what I found. The short version: asking NPS right after a product tour is almost always a mistake.

NPS measures loyalty, which requires experience over time. A user who completed onboarding 30 seconds ago hasn't formed a loyalty opinion. They score 8 or 9 because the tour was nice, then churn 60 days later. Your NPS data was noise the entire time.

The mapping that works better:

- **CES (Customer Effort Score)** immediately after specific tour steps — "How easy was that?" Captures friction while it's fresh.
- **CSAT** at tour completion — rates the tour experience itself on a 1-5 scale.
- **NPS** 14-30 days later, then every 90 days — only after users have had enough time to form real opinions.

Some data points that surprised me:
- In-app surveys hit 20-40% response rates vs 5-15% for email (Refiner.io)
- Adding open-text follow-up fields increases abandonment by 24% (Zigpoll)
- 49% of companies already combine NPS with CSAT or CES (CustomerGauge)
- An email reminder 7 days after an in-app survey can recover ~13% additional responses

The other thing nobody talks about: survey fatigue during onboarding. Users are already learning new navigation and concepts. Stacking a survey on top of that cognitive load increases abandonment of the onboarding flow itself. For developer-facing products it's even worse — interrupting deep focus takes 15-20 minutes to recover from.

Full article with React code examples for event-driven survey triggers: https://usertourkit.com/blog/in-app-nps-vs-post-tour-feedback

Would be curious if anyone has found different timing patterns that work for their products.
