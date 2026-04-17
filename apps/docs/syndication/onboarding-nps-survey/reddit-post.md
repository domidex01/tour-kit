## Subreddit: r/SaaS (primary), r/productmanagement (secondary)

**Title:** I wrote up how we approach onboarding NPS — timing, calculation gotchas, and what to actually do with the score

**Body:**

Been thinking a lot about how most teams (including us) treat onboarding NPS as a "set and forget" metric. You ship the survey, check the number once a quarter, and move on. Detractors churn. Promoters never get asked for a referral.

After digging into the data, a few things stood out:

- **Timing matters more than the question.** The 24-72 hour window after onboarding completion captures the freshest signal. Ask immediately and it feels aggressive. Wait past a week and you're measuring general product sentiment, not onboarding quality.

- **Sample size kills you.** NPS with fewer than 30 responses has a margin of error above ±15 points. We were making product decisions on 12 responses at one point.

- **The follow-up question is where the insight lives.** The 0-10 score tells you something is wrong. "What's the main reason for your score?" tells you what to fix.

- **Benchmarks are all over the place.** B2B SaaS self-serve onboarding typically scores 20-40. Developer tools land lower (15-30) because devs are harsher critics. Anything above 50 is excellent.

The biggest win for us was closing the loop with detractors within 48 hours. Not solving the problem — just acknowledging the feedback. "We hear you, we're on it." According to Retently, detractors who hear back are 2.3x more likely to stay.

Wrote up the full approach with calculation code (TypeScript), benchmark tables, and how we wired it into our analytics: https://usertourkit.com/blog/onboarding-nps-survey

Curious how other teams handle this. Do you send NPS after onboarding, or just rely on relationship NPS?
