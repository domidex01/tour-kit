## Title: How Appcues, Pendo, and UserGuiding affect Core Web Vitals field data

## URL: https://usertourkit.com/blog/onboarding-tool-core-web-vitals

## Comment to post immediately after:

I've been profiling SaaS onboarding tools (Appcues, Pendo, UserGuiding) on a production-grade Next.js app to measure their Core Web Vitals impact. The distinction between Lighthouse (lab) and CrUX (field) matters here — async-loaded scripts look fine in Lighthouse but degrade INP in the field because the main thread contention happens during user interactions, not during initial paint.

The most interesting finding: INP is the metric that gets hit hardest. Third-party scripts contribute to 54% of INP problems (per DebugBear). These tools register event listeners and DOM observers that fire on every interaction, adding 60-80ms per click on mid-range devices. That's enough to push many pages from "Good" (under 200ms) to "Needs Improvement."

The compound effect is what makes this a ranking problem: Google requires passing all three CWV simultaneously. A page that passes LCP and CLS but fails INP still fails overall. At the 75th percentile threshold, you only need 26% of visits to hit "Needs Improvement" on one metric.

None of the three vendors publishes their script payload size. Pendo documents theirs at ~54KB compressed, but Appcues and UserGuiding don't. The article includes a 20-minute field measurement methodology using Google's web-vitals library.

Disclosure: I built Tour Kit, a competing open-source onboarding library. The methodology is reproducible and all third-party data is cited.
