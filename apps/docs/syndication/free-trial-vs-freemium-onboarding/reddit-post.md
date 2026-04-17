## Subreddit: r/reactjs (primary), r/SaaS (secondary)

**Title:** I wrote a guide on designing different onboarding flows for free trial vs freemium — with React code examples

**Body:**

I've been working on onboarding architecture for a while and kept running into the same problem: most guides treat free trial and freemium onboarding as the same thing. They're not.

Trial users arrive with a deadline and an evaluation mindset. Freemium users arrive with no commitment and no urgency. The onboarding flow needs to match that psychology.

Some data points I found interesting while researching this:

- Free trials convert at 15-25% (no CC required), freemium at 2-5% self-serve
- Every 10-minute delay in time-to-first-value costs roughly 8% in conversion
- 7-14 day trials with urgency cues outperform 30-day trials by 71%
- 65% of PLG SaaS companies now run hybrid models (freemium + premium feature trials)
- Behavior-based emails during trials convert at 24%, which is 8x generic emails

The biggest gap I found: nobody covers WCAG-compliant onboarding design. Every search result for "free trial onboarding accessibility" returns accessibility tools that offer free trials, not guidance on making the onboarding flow itself accessible. Countdown timers need aria-live regions, tour overlays need focus management, animations need to respect prefers-reduced-motion.

The article includes React code examples for implementing conditional onboarding flows based on user tier (trial vs freemium vs hybrid), using hooks for scheduling, adoption tracking, and analytics.

Full article with all code examples and comparison table: https://usertourkit.com/blog/free-trial-vs-freemium-onboarding

Curious if anyone has experience with hybrid models and how you handle the dual entitlement complexity on the engineering side.
