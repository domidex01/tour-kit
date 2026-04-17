Your Lighthouse score looks fine. Your Core Web Vitals might not.

We tested how three popular onboarding tools — Appcues, Pendo, and UserGuiding — affect the field metrics Google actually uses for page ranking. The finding that surprised me most: INP (Interaction to Next Paint) is the metric that gets hit hardest.

These tools load JavaScript on every page, register event listeners, and poll the DOM — even when no onboarding flow is active. Third-party scripts contribute to 54% of INP problems. In our testing, the additional main-thread work pushed interaction latency past the 200ms "Good" threshold on mid-range devices.

The compound effect is what makes this a real SEO risk: Google requires passing all three CWV (LCP, INP, CLS) simultaneously. One failure means the entire page fails. And at the 75th percentile threshold, this only needs to affect about a quarter of your visitors.

Full analysis with measurement methodology and mitigation strategies: https://usertourkit.com/blog/onboarding-tool-core-web-vitals

#webperformance #corewebvitals #react #javascript #seo #productmanagement
