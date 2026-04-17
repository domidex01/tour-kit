## Subreddit: r/reactjs (primary), r/startups (secondary)

**Title:** I calculated the cost of SaaS onboarding tools vs open-source libraries for seed-stage startups. Here's the math.

**Body:**

I've been thinking about the build-vs-buy question for onboarding specifically at the YC/seed stage, and I ran the numbers.

The short version: Appcues Essentials runs $2,988/year. Userpilot Starter is $3,588/year. Both bill per MAU, so your costs scale as you grow. An open-source library costs $0 in licensing and 4-8 hours of engineer time to set up a standard 5-step tour.

For a team with $500K in the bank and 12-18 months of runway, the question isn't whether $300/month is "a lot." It's whether that $300/month compounds alongside your other SaaS subscriptions (analytics, feature flags, error monitoring, session replay) to become a meaningful chunk of burn rate before you've found product-market fit.

Three things make seed-stage startups particularly bad customers for onboarding SaaS:

1. **You already have React engineers.** The whole value prop of these tools is that non-technical people can build tours. If your founders write code, you're paying for a capability you don't need.

2. **MAU pricing punishes growth.** Go from 2K to 10K users and your onboarding bill doubles or triples. The library cost stays at zero.

3. **You'll pivot.** Tour flows tied to a vendor dashboard break when your product changes direction. Tours in your codebase get refactored with everything else.

The counterpoint is fair: if nobody on your team writes frontend code, or your growth lead needs to ship onboarding changes without engineering, SaaS removes a real bottleneck. Not every team should avoid it.

Retool's 2026 Build vs. Buy Report found that 35% of enterprises have already replaced at least one SaaS tool with custom software. AI-assisted dev is shifting the math further toward "build" for teams that have the engineering talent.

Full article with the comparison table, code examples, and the decision framework: https://usertourkit.com/blog/yc-startups-skip-saas-onboarding-tools

Disclosure: I built Tour Kit, an open-source React library for product tours. Obviously biased, but the cost data is sourced from vendor pricing pages and you can verify it.
