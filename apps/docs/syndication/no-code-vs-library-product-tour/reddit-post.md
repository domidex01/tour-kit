## Subreddit: r/reactjs

**Title:** I mapped out when to use a no-code onboarding tool vs a React library — here's the decision framework by team size

**Body:**

I've been researching the no-code vs library question for product tours and kept finding the same vague advice: "it depends on your needs." So I put together a concrete framework based on team size and stage.

The short version:

- **Solo/1-3 person team:** Library. You're the engineer and the PM. No-code tools solve a coordination problem you don't have yet, and $300/month is rent money at this stage.
- **Seed (1 PM + 3-5 devs):** Still library, but invest in analytics. The tipping point is whether your PM needs to edit tour copy without a Jira ticket — not how many tours you have.
- **Series A (10+ people, growth team):** This is where it gets real. If your growth PM iterates weekly, no-code pays for itself (Appcues claims 25% higher activation for weekly iteration). If tours change monthly, the library path costs less.
- **Series B+ (50+ employees):** Probably both. No-code for experiments, library for the core flow that needs design system consistency.

Some things I found that surprised me:

1. **No-code tools don't publish their bundle sizes.** Not Appcues, not Userpilot, not Chameleon. You're injecting a third-party script and trusting it won't hurt your Core Web Vitals.
2. **Accessibility is unauditable with no-code.** The injected DOM elements sit outside your React tree. You can't control ARIA attributes or focus management. Pages with ARIA present average 41% more detected errors than pages without (MDN docs).
3. **Migration takes 2-4 weeks.** If you ever want to leave a no-code tool, you're rebuilding every tour from scratch. Analytics data stays behind.
4. **DOM injection collides with React 19 and Next.js App Router.** No-code tools don't understand component boundaries, suspense boundaries, or streaming HTML.

Pricing comparison (as of April 2026): Appcues $300-750/month, Userpilot $299/month, Chameleon $299-1,250/month, Pendo $15k-140k+/year. All scale with MAU. Libraries are $0 (MIT) + developer time.

Full article with comparison table and code examples: https://usertourkit.com/blog/no-code-vs-library-product-tour

Disclosure: I built Tour Kit (an open-source React tour library), so I'm biased toward libraries. But I tried to be fair — no-code tools genuinely make sense at certain stages. Curious what others have experienced.
