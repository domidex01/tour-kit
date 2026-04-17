## Subreddit: r/reactjs

**Title:** I documented the vendor lock-in patterns in SaaS onboarding tools — here's what migration actually costs

**Body:**

I spent a few weeks researching what happens when teams try to leave onboarding platforms like Appcues, Pendo, and Userpilot. The short version: your tour definitions are stored in proprietary formats with no portable export, migration takes 3-4 weeks, and historical analytics data doesn't transfer at all.

Some numbers that stood out:

- 74% of SaaS buyers now evaluate switching costs before purchase (up from 47% in 2018)
- SaaS price inflation hit 8.7% YoY in 2025 — nearly 5x general market inflation
- The real cost of vendor lock-in runs 2-3x the visible platform cost when you account for engineering time
- 60% of SaaS vendors deliberately mask their rising prices through packaging changes

The article covers the lock-in playbook (proprietary formats, CSS selector fragility, analytics data that doesn't travel), the actual migration cost breakdown, and when SaaS lock-in is genuinely worth accepting.

I built Tour Kit (an open-source React onboarding library), so I'm biased toward code-owned approaches. I tried to steelman the SaaS side honestly — visual builders and mature analytics are real advantages for teams without frontend engineers.

Full article with comparison table and code examples: https://usertourkit.com/blog/vendor-lock-in-onboarding-tool

---

## Subreddit: r/SaaS

**Title:** The vendor lock-in playbook in SaaS onboarding tools — and what it costs to leave

**Body:**

I wrote up a deep-dive on vendor lock-in specific to onboarding/product tour SaaS tools. The pattern is the same one OneUptime documented for monitoring: make getting started easy, introduce proprietary formats, encourage custom integrations, make data export painful.

Key data points:

- Migration between onboarding platforms takes 3-4 weeks (documented by Product Fruits)
- Historical analytics data doesn't transfer between platforms
- Pendo averages ~$48K/year with 5-20% renewal uplifts
- SaaS price inflation at 8.7% vs 2.8% IT budget growth

I'm biased — I built an open-source alternative. But the article also covers when SaaS lock-in is worth accepting (visual builders, mature analytics, speed to first value).

Full breakdown: https://usertourkit.com/blog/vendor-lock-in-onboarding-tool
