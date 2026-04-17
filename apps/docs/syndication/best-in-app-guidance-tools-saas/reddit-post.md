## Subreddit: r/SaaS (secondary: r/reactjs)

**Title:** I tested 10 in-app guidance tools — pricing ranges from $69/mo to $405K/yr. Here's what I found.

**Body:**

I spent a week evaluating in-app guidance tools for SaaS — everything from headless open-source libraries to enterprise platforms. The pricing disparity is wild.

**The short version:**

- Enterprise DAPs (WalkMe, Whatfix) cost $79K-$405K/year and take 4-12 weeks to migrate. They handle multi-app workflows across SAP/Salesforce/Workday that nothing else covers.
- Mid-market platforms (Userpilot at $299/mo, Appcues at $300/mo, Userflow at $240/mo) give you no-code builders with Chrome extensions. Userpilot has the best analytics, Appcues has the fastest setup, Userflow has AI-generated flows.
- Budget options (UserGuiding at $69/mo, Chameleon free tier) cover the basics for early-stage teams.
- Open-source (Shepherd.js with 13K+ stars, React Joyride with 7.6K stars) gives you code control with zero monthly cost. Shepherd.js requires AGPL commercial license ($50-$300) for proprietary use.
- Headless libraries (Tour Kit, OnboardJS) ship under 8KB and let you own the entire UI layer. Trade-off: you need developers to implement.

**Biggest surprise:** No major vendor publicly benchmarks their bundle size impact or WCAG compliance level. SaaS platform scripts typically add 80-200KB to your JS bundle. If you care about Core Web Vitals on mobile, that matters.

**What I'd pick based on team type:**
- React devs wanting control → headless library
- Product team wanting speed → Appcues or Userpilot
- Enterprise with $50K+ budget → Pendo (analytics + guidance in one)
- Pre-Series A → UserGuiding at $69/mo

Full breakdown with comparison table and code examples: https://usertourkit.com/blog/best-in-app-guidance-tools-saas

Disclosure: I built Tour Kit (one of the tools listed). Tried to be fair — every number is sourced from public docs, G2, or npm.
