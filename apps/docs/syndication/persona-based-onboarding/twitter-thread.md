## Thread (6 tweets)

**1/** Your admin and your analyst shouldn't see the same product tour.

Personalized onboarding increases 30-day retention by 52% vs generic flows.

Here's how to build persona-based onboarding in React with full type safety:

**2/** The key insight: roles != personas.

A role = what a user CAN do (permissions)
A persona = what a user WANTS to do (intent)

Same "admin" role might contain a technical founder wanting API access and a CEO wanting dashboards.

Model personas as TypeScript discriminated unions for exhaustive checking.

**3/** ProdPad cut activation time from 6 weeks to 10 days by segmenting onboarding by persona.

Their email CTR jumped from <1% to 15%+.

74% of users prefer onboarding that adapts to their behavior. Generic tours signal you don't understand your users.

**4/** Two implementation patterns:

1. Separate tour configs per persona (clean when tours differ completely)
2. Shared tour with `when` prop on steps (good when 60-70% of steps overlap)

Dynamic imports split persona configs into separate chunks: 14KB total -> 4-6KB per user.

**5/** The gap nobody covers: accessibility for persona-conditional tours.

When different users see different step counts, screen reader announcements need to say "Step 2 of 5", not "Step 2 of 8."

Count only active steps, not total possible steps.

**6/** Full guide with working TypeScript code:

- Discriminated union persona types
- Runtime resolution from auth + surveys
- Conditional step rendering
- Per-persona analytics
- Accessibility patterns

https://usertourkit.com/blog/persona-based-onboarding
