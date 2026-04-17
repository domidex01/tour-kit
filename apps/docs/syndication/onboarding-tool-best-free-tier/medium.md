*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-tool-best-free-tier)*

# Which Onboarding Tool Actually Has a Free Tier?

## Most "free" onboarding tools are just trials. We tested 10 to find the ones that stay free.

"Free" shows up on every onboarding tool's pricing page. Sometimes it means a permanent plan with real feature access. Sometimes it means 14 days before a credit card prompt. And sometimes it means an AGPL license that your legal team won't approve.

We tested free plans across 10 SaaS onboarding tools and 8 open-source libraries. The real question isn't "which tool is free." It's which one stays free long enough to matter.

## The short answer

For non-technical teams, Product Fruits offers 5,000 monthly active users with unlimited tours at no cost -- the highest free cap of any SaaS tool as of April 2026.

For developers who can write React components, Tour Kit gives you an MIT-licensed onboarding stack with zero user restrictions and under 20KB total. Pendo Free works at 500 users, but the jump to enterprise pricing ($15,000+/year) is steep.

**Disclosure:** We built Tour Kit. Every claim below is verifiable against npm, GitHub, or the vendor's pricing page.

## What's actually free?

Only six SaaS tools have genuine free-forever plans. The rest are trials.

**Free forever:** Product Fruits (5,000 MAU), Userflow (1,000 MAU), CommandBar (1,000 MAU), Chameleon (1,000 MAU, 10 experiences), Pendo (500 MAU), UserGuiding (100 MAU).

**Trial only:** Appcues (21 days, then $249/mo), Userpilot (14 days, then $249/mo), WalkMe (enterprise only), Whatfix (enterprise only).

**Open source (truly free):** Tour Kit (MIT), React Joyride (MIT), Driver.js (MIT). Shepherd.js and Intro.js are AGPL -- free for open source, $10-$300 for commercial use.

## The hidden cost nobody talks about

Every SaaS tool uses MAU-based pricing. Chameleon's free plan covers 1,000 users. Cross 1,001 and you're at $249-$299/month. That's $0 to $3,000+/year triggered by a single new user.

Your tour configurations, targeting rules, and analytics history live on the vendor's servers. Switch tools and you rebuild from scratch.

Open-source libraries avoid the MAU cliff, but you pay in engineering time instead. The library gets you the first tour; then you need targeting, analytics, localization, and checklists.

Tour Kit's approach: MIT core packages are permanently free. Extended packages (analytics, checklists, surveys) are $99 one-time. No MAU limits on either tier.

## The accessibility gap

We searched 15 "best free onboarding tool" articles. Zero evaluated WCAG compliance.

Onboarding tours overlay your UI, trap focus, and inject dynamic content -- exactly the patterns that break screen readers. Shepherd.js is the only established library with documented WCAG support. Tour Kit ships WCAG 2.1 AA compliance in its free tier, scoring Lighthouse accessibility 100.

## Our recommendation

For developer teams: Tour Kit. MIT license, zero MAU restrictions, headless architecture, accessibility built in.

For non-technical teams: Product Fruits (5,000 MAU free) or Userflow (1,000 MAU free).

Full comparison table and code examples: [usertourkit.com/blog/onboarding-tool-best-free-tier](https://usertourkit.com/blog/onboarding-tool-best-free-tier)
