## Thread (6 tweets)

**1/** Your admin user and your free-trial signup don't need the same product tour.

User segmentation is how you stop showing the same walkthrough to every user. Here's the breakdown:

**2/** Six types of segmentation for tours:

- Demographic (role, location)
- Behavioral (feature usage, events)
- Psychographic (goals, motivation)
- Experience level (new vs power user)
- Journey stage (trial, churned, active)
- Firmographic/B2B (company size, plan tier)

**3/** The data is clear:

SocialPilot: +20% activation, -15% churn after segmenting onboarding.
Formbricks: personalized paths increase completion rates by ~35%.

Not small numbers for what's essentially conditional rendering.

**4/** One angle nobody talks about: segmentation and accessibility.

W3C WAI guidelines call for personalization that accounts for cognitive and motor needs. Segments respecting prefers-reduced-motion aren't just nice UX — they're where WCAG 3.0 is heading.

**5/** In React, it's ~20 lines:

A function maps user data → segment.
Each segment loads a different tour config.

No vendor dashboard needed. The logic lives in your codebase — version-controlled and testable.

**6/** Full breakdown with comparison table, code example, and FAQ:

https://usertourkit.com/blog/what-is-user-segmentation-onboarding
