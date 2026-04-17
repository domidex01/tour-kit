## Title: Tracking product tour metrics with Plausible Analytics (privacy-first, 1KB script)

## URL: https://usertourkit.com/blog/plausible-analytics-product-tour

## Comment to post immediately after:

I built Tour Kit, a headless product tour library for React, and kept running into data accuracy problems with GA4 for tracking tour completion. The consent banner that GA4 requires during onboarding creates friction at exactly the wrong moment, and roughly 55.6% of visitors reject it — so more than half your tour analytics data is missing.

This tutorial covers wiring Tour Kit's lifecycle callbacks to Plausible's custom events API. The interesting technical bits: Plausible's entire script is ~1 KB (vs GA4's 45.7 KB), it requires no cookies, and the `plausible-tracker` npm package gives you a programmatic `trackEvent()` for SPAs.

The main tradeoff vs PostHog or Mixpanel is that Plausible has no built-in funnel visualization. I show how to reconstruct step-by-step funnels by filtering events with custom properties, and how to use the Stats API to automate it.

One non-obvious gotcha: Plausible custom events count toward your monthly pageview quota. A 5-step tour generates 7 events per user per run. The article includes a cost breakdown table for different event budgeting strategies.
