## Thread (6 tweets)

**1/** Your Lighthouse score is a lab test. Core Web Vitals are the field exam.

We tested how Appcues, Pendo, and UserGuiding affect LCP, INP, and CLS — the metrics Google actually uses for ranking.

The async loading trick hides the cost in Lighthouse. Field data tells a different story.

**2/** INP is where it gets ugly.

Third-party scripts cause 54% of INP problems. Onboarding tools register event listeners + DOM observers that fire on EVERY interaction.

Result: 60-80ms added per click on mid-range devices. That pushes many pages past the 200ms "Good" threshold.

**3/** The compound effect is the real problem.

Google requires passing ALL THREE CWV simultaneously. Pass LCP + CLS but fail INP? The entire page fails.

At the 75th percentile, this only needs to affect 26% of your users.

**4/** None of these tools publish their script payload size.

Pendo: ~54KB compressed (they document it)
Appcues: ~80-120KB compressed (our measurement)
UserGuiding: unknown

All three load on EVERY page, even when no tour is active.

**5/** You can measure this yourself in 20 minutes:

Deploy Google's web-vitals library, gather 48h of data with the tool enabled, then 48h disabled.

Compare 75th percentile values. Lighthouse won't catch this — you need field data.

**6/** Full analysis with comparison tables, decision framework, and mitigation strategies if you're keeping your SaaS tool:

https://usertourkit.com/blog/onboarding-tool-core-web-vitals

(Disclosure: I built Tour Kit, a competing library. Methodology is reproducible, all claims cited.)
