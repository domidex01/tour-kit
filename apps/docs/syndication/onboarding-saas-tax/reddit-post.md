## Subreddit: r/webdev (primary), r/reactjs (secondary)

**Title:** I sized the onboarding SaaS market — $3.6B, and most of it flows away from the developers maintaining it

**Body:**

I've been digging into the economics of onboarding tools (Appcues, Pendo, Userpilot, WalkMe, etc.) and the numbers are striking.

The combined digital adoption platform + onboarding software market sits around $3.6 billion in 2026. SAP paid $1.5B just for WalkMe last year — not for the tech, but for the enterprise lock-in.

The structural problem I keep seeing: product managers buy these tools, but engineering teams absorb the real cost. The subscription fee ($300/mo for Appcues, $48K/year avg for Pendo) is the smallest part of the bill. The bigger cost is integration maintenance — CSS conflicts with your design system, bundle bloat (these tools inject 30-60KB each), quarterly vendor update cycles, and the annual migration sprint when someone decides to switch platforms.

SpeedCurve's research shows pages with third-party scripts can hit 26.82s LCP vs under 1s without them. Twenty external scripts is the average website.

To be fair, building from scratch isn't free either — estimates range from $60K (startup) to $3.5M (enterprise). And the no-code builders genuinely help PMs iterate faster.

But I think most of the onboarding logic (step sequencing, progress tracking, conditional display) is a solved problem in 200-400 lines of TypeScript. The real question is whether $3.6B of value needs to flow through vendor lock-in and proprietary scripts.

Full breakdown with all sources and market data: https://usertourkit.com/blog/onboarding-saas-tax

Disclosure: I built an open-source onboarding library (Tour Kit), so I have skin in the game. All market data comes from Fortune Business Insights, Market Research Future, and independent reports — not my own benchmarks.

Curious what other devs think. Are onboarding tools worth the integration overhead for your team, or have you switched to in-house solutions?
