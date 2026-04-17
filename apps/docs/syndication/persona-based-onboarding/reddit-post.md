## Subreddit: r/reactjs

**Title:** How we built persona-based onboarding with TypeScript discriminated unions

**Body:**

I've been working on onboarding flows for a B2B dashboard where three distinct user types (admins, developers, analysts) each need completely different tours. The generic "show everyone everything" approach was failing badly. 74% of users apparently prefer onboarding that adapts to their behavior, and ProdPad saw activation time drop from 6 weeks to 10 days after segmenting by persona.

The pattern I landed on: model personas as a TypeScript discriminated union with a `kind` field, resolve them from auth + onboarding survey data in a React context, then either render separate tour configs per persona or use a `when` prop on individual steps for shared tours with persona-specific branches.

The discriminated union approach is what makes it work. Adding a new persona type forces you to handle it everywhere at compile time. No silent fallthrough when someone adds "designer" to the backend but forgets the tour config.

For bundle size, dynamic imports split each persona's config into its own chunk so the developer never downloads admin tour content. On our test dashboard, this cut onboarding JS from 14KB to 4-6KB per user.

One thing I didn't find covered anywhere else: accessibility for persona-conditional tours. When different users see different step counts, the screen reader progress announcements need to reflect the actual sequence, not the total possible steps.

Full writeup with working code: https://usertourkit.com/blog/persona-based-onboarding

Curious if anyone else has tackled this pattern differently. Would love to hear about edge cases with personas that change mid-session.
