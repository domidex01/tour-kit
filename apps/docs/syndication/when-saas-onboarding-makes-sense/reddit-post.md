## Subreddit: r/reactjs (cross-post to r/SaaS)

**Title:** I build an open-source product tour library — here are 6 scenarios where I'd tell you to use a SaaS tool instead

**Body:**

I'm the author of Tour Kit, an open-source React library for product tours. My business literally depends on people choosing code over SaaS platforms like Appcues or Userpilot. So this might sound counterintuitive.

After watching teams adopt both approaches, I wrote up the six scenarios where SaaS onboarding tools are genuinely the better choice:

1. **Your onboarding owner can't write React.** If a PM owns onboarding and iterates weekly, a library creates a developer bottleneck. SaaS visual editors eliminate it.

2. **You need it live this week.** SaaS deploys in under an hour. Building in-house costs ~$45K upfront and takes 2+ months (Appcues' own estimate).

3. **You need built-in analytics + A/B testing.** Libraries give you hooks. SaaS gives you a dashboard, segmentation, and experimentation in one tool.

4. **Onboarding spans email + in-app + push.** A React library only covers in-app. Period.

5. **Enterprise compliance.** SOC 2 reports, audit logs, data residency — mature SaaS vendors have this infrastructure. You'd spend months building it.

6. **50+ flows across multiple products.** Every copy change requiring a PR doesn't scale when non-engineers need to contribute.

Where libraries win: MAU-based pricing makes SaaS expensive at scale ($50K+/year at 100K MAU), third-party scripts hurt Core Web Vitals, and SaaS UI never matches your design system. Plus 35% of enterprises are already replacing SaaS with custom builds (Retool 2026 report).

The honest answer: it depends on who owns onboarding at your company. Org chart > tech stack.

Full article with a decision framework and comparison table: https://usertourkit.com/blog/when-saas-onboarding-makes-sense

Happy to answer questions about the trade-offs. What's your team's experience with build vs buy for onboarding?
