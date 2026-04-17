## Subreddit: r/reactjs

**Title:** I measured how Appcues, Pendo, and UserGuiding affect Core Web Vitals on a Next.js app — INP is where it gets ugly

**Body:**

I've been profiling third-party onboarding tools as part of building an open-source alternative, and I wanted to share the Core Web Vitals findings because I think the INP impact is underreported.

The key distinction: Lighthouse scores (lab data) look fine because these tools load async. But Core Web Vitals are field data — real measurements from real Chrome users — and that's what Google uses for ranking. The async loading trick hides the cost in Lighthouse but not in CrUX.

All three tools (Appcues, Pendo, UserGuiding) follow the same architecture: a CDN-hosted script loads on every page, fetches remote config, polls the DOM for target elements, and attaches event listeners — whether or not a tour is active on that page.

The INP impact is the worst part. Third-party scripts contribute to 54% of INP problems (DebugBear data). These tools register event handlers that run on every user interaction. When a user clicks a button, the browser runs the onboarding tool's listeners before painting. In our testing, this pushed INP from 140ms to 220ms on a mid-range device — crossing the 200ms "Good" threshold.

The compound effect is what catches people: you can pass LCP and CLS individually but fail INP, and one CWV failure means the entire page fails. At the 75th percentile (where Google evaluates), this only needs to affect 26% of visits.

If you want to check your own site: deploy Google's `web-vitals` library, gather 48 hours of data with the onboarding tool enabled, then 48 hours disabled, and compare 75th percentile values. Lighthouse won't catch this.

Full writeup with measurement methodology, decision framework, and mitigation strategies if you're keeping your SaaS tool: https://usertourkit.com/blog/onboarding-tool-core-web-vitals

Bias disclosure: I built Tour Kit, an npm-installed onboarding library, so I have an obvious interest in this topic. The measurement methodology is reproducible and all external claims are cited.
