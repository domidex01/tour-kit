## Subreddit: r/reactjs

**Title:** We compared free tiers across 10 onboarding tools and 8 open-source libraries -- here's what's actually free

**Body:**

I spent a week testing the "free" plans of every onboarding/product tour tool I could find. The results were eye-opening: only 6 out of 10 SaaS tools actually have free-forever plans. The rest are 14-21 day trials that immediately jump to $249+/month.

Here's the quick breakdown of what's genuinely free:

- **Product Fruits:** 5,000 MAU, unlimited tours (highest SaaS free cap)
- **Userflow:** 1,000 MAU, unlimited tours, 1 seat
- **Chameleon:** 1,000 MAU, but only 10 experiences
- **Pendo:** 500 MAU with basic analytics (enterprise pricing starts at $15K/year when you need more)
- **UserGuiding:** Only 100 MAU on free plan

Open source options: React Joyride (MIT, 7.6K stars), Driver.js (MIT), Shepherd.js (AGPL -- needs commercial license for proprietary apps).

The thing nobody talks about: zero of the 15 comparison articles I found on page 1-3 of Google evaluate WCAG accessibility compliance. Onboarding tours overlay your UI and trap focus -- exactly what breaks screen readers. Shepherd.js is the only established library that documents WCAG support.

I work on Tour Kit (MIT, headless, React 18+), which is also free with no MAU cap. Disclosing the bias upfront. The full comparison with a detailed table covering all 15 tools is here if useful: https://usertourkit.com/blog/onboarding-tool-best-free-tier

Curious what others are using for onboarding -- especially interested in whether anyone has evaluated accessibility across these tools.
