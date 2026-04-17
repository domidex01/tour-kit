## Thread (6 tweets)

**1/** Most teams pay $3-5K/month for Appcues or Pendo to show product tours.

There's a third option: assemble an open-source onboarding stack from composable libraries.

I mapped every layer. Here's what I found 🧵

**2/** The stack has 5 layers:

• Guidance (tours, hints, checklists)
• Analytics (completion, drop-off)
• Feature flags (targeting)
• Feedback (NPS/CSAT surveys)
• UI (your design system)

SaaS bundles all 5. Open source lets you pick the best tool for each.

**3/** The cost math:

Build from scratch: $60K-$200K (Userpilot data)
Buy SaaS: $3K-8K/month at 10K MAU
Open-source stack: $0 licensing + dev time for assembly

Bundle size: SaaS adds 150-400KB. Full open-source stack: under 55KB gzipped.

**4/** The React 19 problem:

React Joyride = 400K downloads/week but incompatible with React 19 and hasn't been updated in 9 months.

Teams upgrading need alternatives. Only Tour Kit and OnboardJS are headless + React 19 native.

**5/** The PostHog connection:

PostHog does analytics, session replay, feature flags, and A/B testing.

But it can't do in-app guidance. Tour library + PostHog = the complete open-source onboarding stack.

**6/** Full guide with comparison tables, cost analysis, code examples, and the reference architecture:

https://usertourkit.com/blog/open-source-onboarding-stack

(Disclosure: I built Tour Kit. All data is verifiable on npm/bundlephobia.)
