## Subreddit: r/SaaS (primary), r/analytics (secondary)

**Title:** I built tour-level attribution for onboarding flows — here's what I learned about which tours actually drive conversions

**Body:**

Most SaaS teams track "onboarding completion rate" as a single number and call it a day. We wanted to know something more specific: of the five tours in our onboarding flow, which ones actually correlate with paid conversion?

Turns out, the standard attribution models (first-touch, last-touch) that marketing teams use for channels work just as well inside the product, but nobody's applying them there. Mixpanel, Amplitude, and PostHog all support custom events, but none of them natively model "Tour A gets 40% credit, Tour B gets 60%."

The most useful finding: we ran a holdout group (15% of users saw no tours at all) and compared conversion rates. That's the only way to prove tours actually cause conversions rather than just coincide with them. The difference was significant, but not for every tour. Two of our five tours had near-zero impact on conversion. We would never have known without the holdout.

For anyone interested, the U-shaped attribution model (40% credit to first touchpoint, 40% to last, 20% split across middle) was the most useful starting point. It captures "what started the journey" and "what sealed the deal" without needing 1,000+ conversions for ML-based models.

Full writeup with TypeScript code examples for the attribution calculator and analytics plugin: https://usertourkit.com/blog/onboarding-attribution-tour-conversion
