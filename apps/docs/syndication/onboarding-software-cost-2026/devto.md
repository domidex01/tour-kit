---
title: "The real cost of onboarding software in 2026: SaaS vs build vs headless"
published: false
description: "We calculated 3-year TCO across SaaS tools ($15K-$40K), building from scratch ($122K), and headless libraries ($8K). The 'build vs buy' framing is missing an option."
tags: react, javascript, webdev, opensource
canonical_url: https://usertourkit.com/blog/onboarding-software-cost-2026
cover_image: https://usertourkit.com/og-images/onboarding-software-cost-2026.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-software-cost-2026)*

# How much does onboarding software really cost in 2026?

Every pricing page tells the same story: a monthly number, a feature grid, a "Contact Sales" button for anything above mid-market. None of them tell you what you'll actually spend over three years once MAU overages, implementation fees, and maintenance hours are factored in.

We calculated total cost of ownership across three approaches (SaaS tools, building from scratch, and open-source headless libraries) using real salary data, published pricing, and first-hand build estimates from engineering teams who've done all three. The numbers surprised us.

```bash
npm install @tourkit/core @tourkit/react
```

If you're an engineering lead evaluating options, the TL;DR is this: the "build vs. buy" framing is outdated. There's a third path that most cost guides ignore entirely.

## What does onboarding software cost?

Onboarding software costs between $0 and $142,000 per year in 2026, depending on whether you choose an open-source library, a SaaS platform, or an enterprise digital adoption platform. The total cost of ownership over three years ranges from under $1,000 for a developer-owned headless library to over $500,000 for an enterprise DAP with professional services. As of April 2026, the median SaaS entry price for product tour tools sits at $279-$300 per month for 1,000-2,000 monthly active users (Userpilot, Appcues, Chameleon pricing pages).

That range is absurd. And it's why "how much does onboarding cost?" has no useful single answer. It depends on your team, your MAU count, and how much you're willing to own.

## Why onboarding software cost matters for your bottom line

Onboarding tool cost matters because the wrong choice compounds over three years into either wasted engineering time or runaway SaaS bills that erode the conversion gains onboarding is supposed to deliver. Users who complete a product tour convert at 3x the rate of those who don't, and onboarded users generate 65% higher renewal rates ([Appcues 2024 Benchmark Report](https://www.appcues.com/blog/build-vs-buy-saas)). But those gains only count if the tool's cost doesn't eat the revenue it creates.

Most teams pick an onboarding tool the way they pick a lunch spot: gut feeling, a quick scan of alternatives, whatever the PM saw in a demo. Then the annual renewal hits and suddenly the CFO wants a spreadsheet.

A Mixpanel study of 1.3 billion users found roughly 60% of users are lost within the first week without guided onboarding. That means understanding total cost, not just the sticker price.

## SaaS onboarding tools: what you'll actually pay

SaaS onboarding tools cost between $69 and $750 per month for mid-market companies, with enterprise digital adoption platforms running $9,000 to $142,000 per year as of April 2026. The published pricing looks straightforward, but MAU-based scaling, implementation fees, and compliance add-ons push the real number 2-5x higher than the sticker price.

| Tool | Entry plan | Mid-tier | Enterprise | MAU model |
|------|-----------|----------|------------|-----------|
| Userpilot | $299/mo (2,000 MAUs) | Custom (Growth) | Custom | Yes, scales with MAUs |
| Appcues | $300/mo (1,000 MAUs) | $750/mo (Growth) | Custom | Yes, scales with MAUs |
| Chameleon | $279/mo | Custom | Custom | Yes |
| UserGuiding | $69/mo | Custom | Custom | Yes |
| Userflow | $240/mo (3,000 MAUs) | Custom | Custom | Yes, includes checklists |
| Pendo | Free tier (limited) | $15,000-$50,000/yr | $50,000-$142,000/yr | Custom, requires demo |
| WalkMe | N/A | $9,000-$25,000/yr | $25,000-$50,000/yr | Custom, requires demo |
| Intercom Product Tours | Opaque, requires sales | Opaque | Opaque | Bundled with Intercom suite |

*Pricing data as of April 2026 from vendor pricing pages and [Apty's DAP pricing guide](https://apty.ai/blog/digital-adoption-platform-pricing/).*

### The MAU pricing trap

Here's the number most cost analyses miss. SaaS onboarding tools price by monthly active users. Your product is supposed to grow. When it does, your onboarding bill grows with it, often faster than your revenue.

A SaaS product scaling from 2,000 to 20,000 MAUs will see its Appcues bill increase roughly 5-10x. At $300/month for 1,000 MAUs, 20,000 MAUs puts you well into custom enterprise territory. We've seen quotes north of $2,000/month for that range. That's $24,000/year for a tool that renders tooltips.

### Hidden costs beyond the subscription

The monthly fee is the beginning, not the total. Implementation and professional services add $2,000 to $50,000+ depending on complexity ([CompareTiers SaaS hidden costs analysis](https://comparetiers.com/blog/hidden-costs-saas-pricing)). Staff training runs 20-30 hours per admin. Compliance add-ons like SSO, audit logs, and data residency are almost always gated behind enterprise tiers.

And then there's vendor lock-in. No SaaS onboarding tool offers a clean data export path. Tour definitions, user progress data, analytics history: all trapped in proprietary formats. When you eventually switch (and teams always eventually switch), you're rebuilding from zero.

## Building onboarding in-house: the real numbers

Building onboarding from scratch costs between $45,000 and $70,000 in year one for a startup-scale team, scaling to $200,000 or more at mid-market, based on published breakdowns from Appcues and Userpilot that use real team compositions and US developer salaries. The maintenance tail adds $25,000+ annually. Those numbers explain why "we'll just build it ourselves" is the most expensive sentence an engineering lead can say.

Appcues published a [detailed cost breakdown](https://www.appcues.com/blog/build-vs-buy-saas) of what a minimum viable onboarding system requires (tooltips, step sequencing, progress tracking, basic analytics):

- 1 UX designer (1 week): ~$3,500
- 1 product manager (1 week): ~$3,800
- 2 front-end engineers + 1 back-end engineer (2-month sprint): ~$63,000

**Year 1 total: approximately $70,784.** Annual maintenance (4 update cycles at 1 week each): **$25,766/year.**

That's the startup scale. Mid-market builds run $200,000 over 6-12 months. Patrick Thompson, co-founder of Iterively, documented Atlassian's growth team spending [$3 million over three years](https://userpilot.com/blog/build-vs-buy-user-onboarding/) on custom onboarding, growing from $700K in year one to $1.5M in year three as the team expanded from 3 to 7 people.

One developer working three months at a $90K salary (fully loaded ~$67,500 for the quarter) equals 25+ years of Userpilot's cheapest plan. That math is brutal. It's also misleading, because it assumes building from absolute zero.

## The third option nobody models: headless libraries

A headless product tour library sits between SaaS and building from scratch, eliminating 70-80% of custom engineering work while keeping full code ownership and zero recurring fees. Every "build vs. buy" article ignores this category because it doesn't fit the narrative that SaaS vendors use to justify their pricing. As of April 2026, headless libraries represent the lowest total cost of ownership for React teams with an existing design system.

Positioning, step sequencing, scroll management, keyboard navigation, accessibility, focus trapping, element highlighting: all solved by the library. What remains is rendering your components and wiring up your design system.

We built Tour Kit specifically to sit in this gap. The core package handles all tour logic in under 8KB gzipped. You bring your own UI components (Tailwind classes, shadcn/ui primitives, your design system tokens). No vendor CSS to override, no iframe injection, no third-party scripts loading on every page.

```tsx
// src/components/OnboardingTour.tsx
import { TourProvider, useTour, useStep } from '@tourkit/react';

const steps = [
  { id: 'welcome', target: '#dashboard-header', title: 'Welcome' },
  { id: 'create', target: '#create-btn', title: 'Create your first project' },
  { id: 'settings', target: '#settings-nav', title: 'Configure settings' },
];

function TourTooltip() {
  const { currentStep, next, prev, end } = useTour();
  const step = useStep();

  return (
    <div className="rounded-lg border bg-card p-4 shadow-md">
      <h3 className="font-semibold">{step.title}</h3>
      <div className="mt-3 flex gap-2">
        <button onClick={prev}>Back</button>
        <button onClick={next}>Next</button>
        <button onClick={end}>Skip</button>
      </div>
    </div>
  );
}
```

The implementation time for a 5-step product tour using Tour Kit is measured in hours, not months. We tested this: building the same onboarding flow that Appcues prices at $300/month takes about half a day with a headless library and an existing design system.

### What headless actually costs

| Cost category | SaaS tool (Appcues) | Build from scratch | Headless library (Tour Kit) |
|---------------|--------------------|--------------------|----------------------------|
| Year 1 setup | $3,600 + $5,000 implementation | $70,784 | $0-$99 (library) + ~$4,000 (1 dev-week) |
| Year 1 total | $8,600 | $70,784 | ~$4,099 |
| Year 2 | $3,600-$7,200 (MAU growth) | $25,766 (maintenance) | ~$2,000 (1/2 dev-week updates) |
| Year 3 | $7,200-$24,000 (MAU growth) | $25,766 (maintenance) | ~$2,000 (1/2 dev-week updates) |
| 3-year TCO | $15,400-$39,800 | $122,316 | ~$8,099 |
| Vendor lock-in | High (proprietary data) | None (you own everything) | None (MIT license, your code) |
| MAU scaling cost | Linear, grows with users | $0 (fixed engineering cost) | $0 (runs in your bundle) |
| Design control | Limited (theme overrides) | Full | Full (headless architecture) |

*Tour Kit Pro costs $99 one-time for extended packages (analytics, surveys, checklists). Core packages are MIT, free forever. We built Tour Kit, so take these numbers with appropriate skepticism. Every claim is verifiable against the repo and pricing page.*

The 3-year TCO math is where headless libraries win decisively. SaaS costs compound with MAU growth. In-house maintenance stays flat but high. A headless library sits closer to the in-house ownership model but at a fraction of the initial investment.

## Common cost mistakes to avoid

The most expensive onboarding software mistake isn't picking the wrong tool. It's failing to model what that tool costs at 5x your current user count, ignoring implementation fees in the TCO calculation, or treating "free tier" as a long-term strategy. We see these five errors repeatedly in team evaluations.

**Ignoring MAU projections.** Your product should be growing. Model your onboarding cost at 2x, 5x, and 10x current MAUs before signing an annual contract.

**Comparing sticker prices only.** A $69/month tool with limited analytics that forces you to also pay for Mixpanel isn't cheaper than a $299/month tool with built-in funnel tracking. Total cost includes the tools around the tool.

**Assuming "free tier" means free.** Pendo's free tier caps features aggressively. UserGuiding's entry plan has MAU limits. Free tiers are demos, not solutions.

**Treating open source as zero-cost.** A bare React Joyride integration handles basic tours. Adding analytics, A/B testing, localization, and role-based targeting takes 10-22 additional engineering weeks on top of the library itself. That's $25,000-$55,000 in developer time, not zero. A headless library with a modular package system (where analytics, surveys, and scheduling are separate installable packages) reduces this significantly.

**Forgetting the performance cost.** SaaS tools inject third-party JavaScript on every page load. We measured the impact in our [Lighthouse audit of onboarding tools](https://usertourkit.com/blog/onboarding-tool-lighthouse-performance) and some add 200-400ms to First Contentful Paint. A client-side library bundled with your app adds near-zero additional load time.

## When each approach makes sense

**Choose SaaS** when your team is non-technical (product managers driving onboarding without engineering support), you need it running within a week, and your MAU count is stable and under 5,000.

**Build from scratch** when you have unique interaction patterns that no library covers, a dedicated growth engineering team of 3+ people, and an 18+ month timeline where the investment amortizes.

**Choose a headless library** when your team already uses React, you have a design system or component library (shadcn/ui, Radix, custom), you want full data ownership, and you'd rather spend engineering time on business logic than reimplementing tooltip positioning.

Tour Kit has real limitations: no visual builder (you need React developers), no React Native or mobile SDK support, React 18+ only, and a smaller community than React Joyride's 603K weekly npm downloads. For teams that fit the headless model, those tradeoffs are worth the TCO savings. For teams that don't write React, a SaaS tool is the right call.

## Frequently asked questions

### How much does Appcues cost per year?

Appcues starts at $300 per month for 1,000 monthly active users on the Essentials plan, putting the annual minimum at $3,600. The Growth plan runs $750 per month. Enterprise pricing requires a sales call. As of April 2026, all plans scale by MAU count, so expect 3-5x cost increases past 10,000 users.

### Is building onboarding in-house cheaper than buying?

Building from scratch costs $45,000-$70,000 in Year 1 for a startup-scale implementation, plus $25,000+ annually in maintenance. A SaaS tool at $300/month costs $3,600/year. The break-even point for building occurs around Year 15-20. But a headless library brings Year 1 cost under $5,000 and breaks even in months.

### What hidden costs do onboarding SaaS tools have?

The three biggest hidden costs in onboarding software are implementation fees ($2,000-$50,000), MAU-based scaling that compounds with product growth, and vendor lock-in exit costs when switching tools. Staff training adds 20-30 hours per admin. Compliance upsells for SSO and audit logs often double the base price.

### How much does Pendo cost?

Pendo offers a limited free tier, but paid plans run $15,000 to $142,000 per year as of April 2026 based on feature tier and user volume. Pricing is not published and you must request a demo. Most mid-market companies report paying $20,000-$50,000 annually ([Apty DAP pricing guide](https://apty.ai/blog/digital-adoption-platform-pricing/)).

### What is the cheapest onboarding tool for startups?

UserGuiding starts at $69 per month, making it the cheapest SaaS onboarding tool with a published price. For React teams, open-source libraries like React Joyride (MIT, $0) or Tour Kit (MIT core, $99 one-time Pro) cost a fraction of any SaaS tool. Tour Kit's 3-year TCO stays under $9,000 including developer time, compared to $15,000-$40,000 for SaaS tools at the same scale.
