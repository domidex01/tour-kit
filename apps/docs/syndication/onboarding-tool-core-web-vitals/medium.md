# How SaaS Onboarding Tools Quietly Tank Your Google Rankings

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-tool-core-web-vitals)*

**Your Lighthouse score is a lab test. Core Web Vitals are the field exam — and Google only cares about the field exam.**

Google uses real-user measurements from Chrome browsers to decide whether your pages pass or fail its Core Web Vitals assessment. That pass/fail status is a confirmed ranking signal. And SaaS onboarding tools — the ones you paste into your HTML as a script tag — affect all three metrics at once.

We tested Appcues, Pendo, and UserGuiding on a production-grade Next.js application. Not Lighthouse scores. Not synthetic benchmarks. The three metrics Google actually evaluates: Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS).

*Disclosure: I built Tour Kit, a competing npm-installed onboarding library. Every claim links to external sources.*

## The numbers that matter

To pass Core Web Vitals, 75% of your page visits must meet "Good" thresholds: LCP under 2.5 seconds, INP under 200 milliseconds, CLS under 0.1. As of the 2025 Web Almanac, only 48% of mobile websites pass all three. Most of the web is already failing.

## What these tools load on every page

All three follow the same architecture: a bootstrap snippet fetches the full SDK from a CDN on every page load, whether or not a tour is active. Appcues loads approximately 80–120KB compressed. Pendo's agent is documented at about 54KB compressed. UserGuiding doesn't publish its size. All three poll the DOM for target elements and inject UI outside your application framework.

## The metric that hurts most: INP

Interaction to Next Paint measures the worst interaction responsiveness on your page. Third-party scripts contribute to 54% of INP problems, according to DebugBear's analysis. Onboarding tools attach event listeners, run DOM observers, and render overlays — all competing with your app for the main thread.

Sites loading fewer than five third-party scripts pass INP at roughly 88%. Sites with 15 or more pass at 64%.

## The compound effect

Google requires you to pass all three metrics simultaneously. Consider a user on a mid-range Android phone, 4G connection:

Your dashboard hero renders at 2.3 seconds (passing LCP). The onboarding SDK adds 150ms of bandwidth contention. LCP moves to 2.45 seconds — still passing, barely.

The user clicks a nav item. Your app handles it in 140ms. The onboarding tool's DOM observer adds 80ms. Total: 220ms. That's above the 200ms INP threshold. Failing.

One failure means the entire page fails Core Web Vitals. And at the 75th percentile, this scenario only needs to affect 26% of your users.

## What you can do

If your engineering team owns onboarding flows, client-side libraries (npm packages bundled into your app) eliminate the third-party overhead entirely. No CDN fetch, no remote config download, no persistent DOM observers.

If you need a SaaS tool for workflow reasons, three mitigation steps: limit the script to pages that actually have tours, use lazy loading strategies, and monitor your field CWV data continuously with Google's web-vitals library.

The 75th percentile doesn't care about your average. It cares about the experience you deliver to the slower quarter of your users.

---

*Full article with code examples, comparison tables, and measurement methodology: [usertourkit.com/blog/onboarding-tool-core-web-vitals](https://usertourkit.com/blog/onboarding-tool-core-web-vitals)*

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, The Startup
