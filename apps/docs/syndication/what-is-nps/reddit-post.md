## Subreddit: r/reactjs

**Title:** I wrote up the developer's version of "what is NPS" — with React code for collecting it in-app after onboarding

**Body:**

I kept running into the same problem: plenty of marketing-focused NPS explainers, but nothing that covers it from the perspective of someone who actually has to implement the survey in a React app.

So I wrote a glossary entry covering the formula (% Promoters minus % Detractors), current SaaS benchmarks (average is +36 according to CustomerGauge's 2025 report, B2B specifically sits at +29), and the timing question that most guides gloss over. In-app surveys pull 20-40% response rates versus 5-15% for email, but only if you trigger them after onboarding completes — not during the tour itself.

The article includes a minimal React implementation using a `useSurvey` hook with built-in throttling (60-day minimum between asks). Also covers why NPS has real limitations: the 0-6 detractor range treats a mildly disappointed user the same as someone who hates your product, and cultural norms create a 15-20 point variance across regions.

Full article with code examples and the comparison table: https://usertourkit.com/blog/what-is-nps

Curious if anyone has a different approach to timing NPS surveys after onboarding flows.
