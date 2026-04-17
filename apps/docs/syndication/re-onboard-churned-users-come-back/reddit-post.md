## Subreddit: r/reactjs

**Title:** Wrote up patterns for re-onboarding churned users — returning users need different tours than new ones

**Body:**

I've been working on win-back onboarding flows and realized most products just replay the first-run tour when a churned user comes back. That's a pretty quick way to lose them a second time.

Wrote a guide covering the patterns I landed on:

- **Returning user detection** without a backend rewrite (localStorage timestamp, server-side session flag, or feature-completion fingerprint)
- **Segmentation**: feature-gap churners need a changelog tour, engagement-gap churners need to resume where they stalled, price-gap churners need value demos. One generic "welcome back" tour doesn't cut it
- **Changelog-driven tours**: only show features released after `user.lastActiveDate` — this was the biggest win
- **Adaptive step filtering**: skip steps the user already completed. Improves completion by ~35% per UserGuiding data

Some stats that shaped the approach: 43% of churn comes from unclear onboarding steps, event-based triggers outperform calendar-based re-engagement 3-5x, and the right success metric is 60-day retention of reactivated users (not "how many saw the tour").

Code examples are in React/TypeScript. Uses Tour Kit for the tour rendering but the detection and segmentation patterns work with any tour library.

Full article with all the code: https://usertourkit.com/blog/re-onboard-churned-users-come-back

Curious if anyone else has built different win-back onboarding patterns — particularly interested in how teams handle the "user who never actually finished first-run onboarding" segment.
