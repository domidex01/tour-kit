## Thread (6 tweets)

**1/** Every "what is user onboarding" article is written for product managers selling SaaS platforms.

None of them answer the actual question: what does onboarding look like in code?

I wrote the developer version.

**2/** For developers, onboarding is four problems running simultaneously:

- State tracking (which flows has this user seen?)
- Conditional logic (show this tour to this role?)
- Rendering (portals, positioning, z-index)
- Measurement (is this actually working?)

**3/** The data is wild:

- 63% of customers say onboarding influences their subscription decision
- Tour completers convert to paid at 2.5x non-completers
- Completion drops from 72% at 3 steps to 16% at 7 steps

Miller's working memory limit explains why. Keep tours under 5 steps.

**4/** The most surprising finding: search for "user onboarding WCAG" or "onboarding ARIA."

Zero useful results.

Yet every tooltip in a product tour needs role="dialog", aria-label, and trapped focus. Almost none handle this correctly.

**5/** Three patterns cover most SaaS onboarding:

1. Welcome tours (3-5 tooltip steps, first login)
2. Setup checklists (required config, like Stripe)
3. Contextual hints (appear when users reach a feature organically)

Pattern 3 is underrated. 80% of users delete apps they can't figure out.

**6/** Full article with a React hook example, comparison table, and FAQ:

https://usertourkit.com/blog/what-is-user-onboarding
