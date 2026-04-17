## Subreddit: r/SaaS (primary), r/reactjs (secondary — React instrumentation angle)

### r/SaaS post

**Title:** I analyzed onboarding benchmarks from 15M product tour interactions and 547 SaaS companies. Here are the 10 metrics that actually predict retention.

**Body:**

I spent a few weeks pulling together benchmark data from Chameleon's 15-million-interaction dataset and Userpilot's study of 547 SaaS companies. Wanted to figure out which onboarding metrics actually matter versus which ones are vanity numbers.

Some findings that surprised me:

- 4-step tours (74% completion) outperform 3-step tours (72%). Too short = not enough value delivered.
- Self-serve tours (user-initiated via hotspot) complete at 123% higher rates than auto-triggered ones. User agency matters more than we think.
- Sales-led growth companies achieve slightly faster time-to-value (1d 11h) than product-led growth (1d 12h). PLG doesn't automatically mean faster activation.
- The average funnel drop-off at step 1 to step 2 is 38%. Over a third of users bail after the first screen.

The 10 metrics I'd track (in priority order): tour completion rate, time to value, activation rate, feature adoption rate, funnel drop-off, 30-day retention, trial conversion, customer effort score, onboarding NPS, and support ticket volume.

But honestly, start with just three: completion rate, TTV, and 30-day retention. Those form a natural funnel that shows you where things break.

Full writeup with formulas, industry-segmented benchmarks (CRM vs HR vs Fintech TTV differences are wild), and React instrumentation code: https://usertourkit.com/blog/measure-onboarding-success-metrics

Happy to answer questions about any of these metrics.

---

### r/reactjs post

**Title:** How I instrument onboarding metrics in React (tour completion, feature adoption, CES surveys)

**Body:**

I've been building a product tour library and needed to track whether the tours actually work. Not just "did the user click through all 4 steps" but "did they retain 30 days later."

Wrote up how I instrument the 10 metrics I care about. The React-specific parts:

- `useTour` hook with `onComplete`, `onStepChange`, and `onDismiss` callbacks that pipe to any analytics provider
- `useAdoption` hook that tracks feature usage against eligible user counts (not total users — big distinction)
- `useSurvey` with CES type that fires immediately after tour completion (response rate drops 60% if you delay 24h)

The code examples use Tour Kit (which I built, full disclosure), but the patterns apply to any analytics setup. The formulas and benchmarks are tool-agnostic.

Article with all 10 metrics, benchmark data from 15M interactions, and the code: https://usertourkit.com/blog/measure-onboarding-success-metrics
