## Subreddit: r/reactjs

**Title:** I mapped out every layer of an open-source onboarding stack (tours, analytics, flags, surveys) — here's what I found

**Body:**

I spent time researching every open-source option for building a product onboarding system without paying $3-5K/month for Appcues or Pendo. Ended up mapping it to five layers:

**Guidance (tours/tooltips/checklists):** Tour Kit (<8KB, MIT, headless), Shepherd.js (~38KB, MIT), Driver.js (~5KB, MIT), React Joyride (~37KB but hasn't been updated in 9 months and doesn't support React 19). OnboardJS is a newer headless option worth watching.

**Analytics:** PostHog is the clear winner for self-hosted — product analytics, session replay, and feature flags in one. Plausible if you want something lighter and privacy-first.

**Feature flags:** PostHog has them built in. GrowthBook (MIT) is solid if you want a standalone option with data warehouse integration.

**Surveys/NPS:** Formbricks (AGPL, self-hosted) is the open-source Typeform alternative. Some tour libraries (Tour Kit, PostHog) have built-in survey support.

**UI:** Headless libraries let you use your own components. If you use shadcn/ui or Radix, a headless tour library means your tours match your design system automatically.

The total bundle for the full stack (Tour Kit + PostHog SDK) comes in under 55KB gzipped. A single SaaS onboarding tool typically adds 150-400KB.

Biggest surprise: React Joyride has 400K weekly downloads but is effectively unmaintained for React 19. And no tour library besides Tour Kit advertises WCAG 2.1 AA accessibility compliance.

Full writeup with comparison tables, cost analysis ($60K to build vs $3-5K/month SaaS vs $0 open-source licensing), and code examples: https://usertourkit.com/blog/open-source-onboarding-stack

Disclosure: I built Tour Kit, so I'm obviously biased. But the comparison data is all verifiable on npm and bundlephobia.
