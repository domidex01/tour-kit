# Product Tour Analytics Without SaaS: Build Your Own Stack

## Why pay $249/month for data you can't query?

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-analytics-open-source-byo-stack)*

Appcues charges $249/month to show tooltips and tell you how many people clicked "Next." Pendo's analytics tier starts even higher. The data those platforms collect sits on their servers, governed by their retention policies, accessible only through their dashboards.

There's another way. Wire your product tour library to open-source analytics tools you already control, and the resulting pipeline costs nothing beyond the infrastructure you're running anyway.

This guide covers four open-source analytics stacks that replace SaaS tour analytics entirely: PostHog, Plausible, Umami, and rolling your own.

---

## The core problem with SaaS analytics

**Data portability.** When you cancel Appcues, your historical tour analytics go with it. Funnel definitions, cohort filters, dashboard configurations? Gone.

**Cost scaling.** Pricing scales with monthly tracked users. Appcues jumps from $249 to custom pricing above 2,500 MTUs. Userpilot starts at $249/month for up to 2,000 MAUs.

**Query limitations.** Want to correlate tour completion with 30-day retention by acquisition channel? That requires exporting data to your own warehouse.

---

## Four stacks, four tradeoffs

**PostHog** is the full Amplitude/Mixpanel replacement. Funnels, retention, session replay, feature flags. MIT licensed, 1M free events/month on cloud, self-hostable.

**Plausible** works when you need "how many completed the tour?" without cookies or consent banners. No funnels, but ~1 KB and GDPR-compliant by default.

**Umami** sits in the middle. MIT-licensed, custom events since v2, deploys to Vercel with Postgres. The advantage: direct SQL access to your event data.

**Roll your own** with a POST endpoint and `navigator.sendBeacon`. No third-party scripts. Tour analytics becomes a SQL query against your existing database.

---

## The real cost comparison

At 10,000 monthly active users:

- Appcues: $2,988/year
- Chameleon: $3,348/year  
- Pendo: $10,000+/year
- Tour Kit + PostHog cloud: $0/year
- Tour Kit + self-hosted PostHog: $480-960/year

The SaaS platforms include visual tour builders and targeting rules. If you're writing tour code in React anyway, those features have less value.

---

## Metrics worth tracking

Most SaaS dashboards default to vanity metrics. "12,000 tours started" means nothing without completion context. Track these instead:

1. **Tour completion rate** (median: 68% under 5 steps, 42% above 7)
2. **Step drop-off index** (which step loses the most users)
3. **Median time-on-step** (above 15 seconds often means confusion)
4. **Tour-to-activation correlation** (the number that predicts retention)
5. **Skip rate** (early vs late skips tell different stories)

---

Full article with TypeScript code examples, plugin implementations, and comparison tables: [usertourkit.com/blog/product-tour-analytics-open-source-byo-stack](https://usertourkit.com/blog/product-tour-analytics-open-source-byo-stack)

*Submit to: JavaScript in Plain English, Better Programming, or Towards Data Science*
