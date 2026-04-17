## Thread (6 tweets)

**1/** GA4 loses ~55.6% of visitor data when consent banners are displayed. If you're tracking product tour completion, that means more than half your funnel data is missing. Here's how to fix it with Plausible Analytics 🧵

**2/** Plausible's script is ~1 KB (vs GA4's 45.7 KB). No cookies, no consent banner needed under GDPR. For onboarding flows, that's a double win: lighter bundle AND more accurate data.

**3/** The integration is simple: map Tour Kit's 4 lifecycle callbacks (onStart, onStepChange, onComplete, onSkip) to Plausible's trackEvent() API. About 50 lines of TypeScript total.

**4/** The main tradeoff: Plausible has no built-in funnel visualization. You reconstruct step-by-step drop-off by filtering events with custom properties. More manual than PostHog, but the data accuracy is worth it.

**5/** Gotcha most tutorials skip: Plausible custom events count toward your pageview quota. A 5-step tour = 7 events per user. At 10K monthly users, that's 70K events. Budget accordingly (or self-host under AGPL for free).

**6/** Full tutorial with TypeScript code, ad blocker proxy setup, event budgeting table, and troubleshooting: https://usertourkit.com/blog/plausible-analytics-product-tour
