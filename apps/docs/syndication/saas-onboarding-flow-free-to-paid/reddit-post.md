## Subreddit: r/SaaS (primary), r/startups (secondary)

**Title:** I analyzed onboarding flows from 7 SaaS products (Slack, Notion, Figma, Dropbox, Canva, Loom, Ahrefs) — here are the patterns that actually convert free to paid

**Body:**

I spent three weeks studying how seven SaaS products handle the free-to-paid transition. Not the pricing page. The onboarding flow — the first 72 hours after signup.

The average freemium conversion rate is 3-5%. Free trials convert at 15-25%. But some products consistently beat those numbers. Here's what they have in common: they don't give you a feature tour. They get you to one specific action that predicts retention.

The seven patterns I found:

- **Progressive disclosure (Slack):** Only shows core features first. Teams who send 2,000 messages in 30 days convert at 93%. Workflows and Huddles surface later.
- **Value-first trial (Notion):** No feature gates at all. The paywall comes from storage limits and team size, which means users are already invested before they ever see a price.
- **Guided setup wizard (Figma):** Asks your role before showing anything. Designers see the canvas. Developers see the inspect tools. +20-35% activation.
- **Activation checklist (Dropbox):** 5-7 tasks with rewards. Dropbox gave 250MB per task. Checklists increase activation by 27%.
- **Aha moment shortcut (Canva):** Gets you to a finished design in under 3 minutes. Users who export in session one return at 4x the rate.
- **Social proof loop (Loom):** Each recording shared brings a new user into the funnel. 2x conversion rate vs products without viral mechanics.
- **Reverse trial (Ahrefs):** Full paid access for 7 days, then downgrade. Loss aversion converts 2-3x better than traditional free tiers.

The biggest mistake I see: treating all free users the same. A user from a Google search and a user invited by a teammate need completely different flows.

I wrote up the full analysis with a comparison table and code examples (React/TypeScript) for implementing each pattern: https://usertourkit.com/blog/saas-onboarding-flow-free-to-paid

What patterns are you using for free-to-paid conversion? Curious what's working for others.
