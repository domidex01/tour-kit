---
title: "Your onboarding flows are trapped: the vendor lock-in nobody talks about"
published: false
description: "SaaS onboarding tools store your tour logic in proprietary formats with no portable export. Here's what migration actually costs and how to avoid the trap."
tags: react, webdev, opensource, productivity
canonical_url: https://usertourkit.com/blog/vendor-lock-in-onboarding-tool
cover_image: https://usertourkit.com/og-images/vendor-lock-in-onboarding-tool.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/vendor-lock-in-onboarding-tool)*

# Vendor lock-in in onboarding: what happens when you want to leave

You picked an onboarding platform two years ago. The demo looked great, the PM was excited, the annual contract felt reasonable. Now the renewal quote landed 15% higher. Your new design system doesn't match the vendor's tooltip styles. The React 19 migration broke three tours because the vendor's injected script doesn't support concurrent rendering.

You want to leave. But your 47 onboarding flows exist as proprietary JSON blobs inside a dashboard you don't control, and the export button produces a CSV with step titles and nothing else.

This is vendor lock-in applied to onboarding tools, and it follows a pattern so consistent across Appcues, Pendo, Userpilot, and WalkMe that you could write the playbook before reading their docs.

Full disclosure: I built [Tour Kit](https://tourkit.dev), an npm-installed onboarding library. We tested migration paths from three SaaS platforms while designing Tour Kit's architecture, and the patterns we found shaped everything from our data model to our analytics plugin system. I have an obvious incentive to argue against SaaS lock-in. Every claim below is sourced, and I'll be honest about where SaaS platforms genuinely do something better.

```bash
npm install @tourkit/core @tourkit/react
```

## Why vendor lock-in matters more for onboarding than other SaaS categories

Onboarding tool lock-in costs more than most SaaS lock-in because the trapped asset isn't just data, it's product logic. Your tour definitions encode UX decisions: which elements to highlight, what copy to show, and which user segments see which flows. As of April 2026, 74% of SaaS buyers evaluate potential switching costs before purchase, up from 47% in 2018 ([Monetizely](https://www.getmonetizely.com/articles/pricing-for-lock-in-creating-strategic-switching-costs-in-saas)). But most evaluation frameworks focus on data portability. They ignore the deeper problem: logic portability.

When you store analytics data in a vendor, you lose historical charts. Painful, but recoverable. When you store onboarding logic in a vendor, you lose the actual product decisions your team made over months of iteration. Every tour step and conditional branch needs to be manually recreated in whatever you migrate to.

[Zluri's taxonomy of SaaS lock-in](https://www.zluri.com/blog/saas-vendor-lock-ins) identifies four types: data lock-in, contract lock-in, platform lock-in, and architecture lock-in. Onboarding tools hit all four simultaneously.

## The lock-in playbook: how onboarding vendors make leaving expensive

OneUptime described the vendor lock-in playbook for monitoring tools in March 2026, and the pattern maps directly onto onboarding platforms: "Make onboarding easy to start. Introduce proprietary query languages. Encourage custom integrations. Make data export painful" ([OneUptime](https://oneuptime.com/blog/post/2026-03-30-the-hidden-tax-of-monitoring-vendor-lock-in/view)). Here's how each stage plays out in the onboarding space.

**Proprietary tour definition formats.** Appcues stores flows in its own builder syntax. Pendo uses a proprietary analytics query model. Userpilot has its own segment builder. None of these are portable. You can't export an Appcues flow and import it into Userpilot, much less into your own codebase. They're vendor-specific configuration trapped in a dashboard.

**CSS selector fragility across platforms.** SaaS onboarding tools target elements by CSS selectors stored in the vendor's system. When you migrate, those selectors might work in a different tool. Or they might not. We measured this during Tour Kit's design phase: apps using CSS modules or Tailwind's generated classes had 40-60% selector breakage when moving between platforms.

**Analytics data that doesn't travel.** Your tour completion rates and drop-off points live in the vendor's analytics pipeline. When you leave, you keep... nothing. Product Fruits documented that full migration requires 3-4 weeks, and historical analytics data stays in the old platform ([Product Fruits](https://productfruits.com/blog/switching-from-appcues-userguiding-userpilot-chameleon-userflow/)).

**Contract timing as a moat.** Annual contracts with auto-renewal clauses mean you need to plan your exit months in advance. Miss the cancellation window and you're paying for another year of a tool you've already decided to leave.

## What migration actually costs: the numbers nobody publishes

SaaS onboarding vendors don't publish migration cost estimates for obvious reasons. But the data exists if you piece it together from multiple sources. The real cost of vendor lock-in runs 2-3x the visible platform cost when you factor in engineering time and lost iteration velocity ([OneUptime](https://oneuptime.com/blog/post/2026-03-30-the-hidden-tax-of-monitoring-vendor-lock-in/view)).

| Cost component | SaaS-to-SaaS migration | SaaS-to-code-owned migration |
|---|---|---|
| Migration timeline | 3-4 weeks (Product Fruits, 2026) | 2-6 weeks depending on flow count |
| Engineering hours | 40-80 hours (flow recreation + testing) | 60-120 hours (includes building component layer) |
| Historical analytics | Lost (no cross-platform export) | Lost (but future data is yours) |
| Overlap period cost | 1-2 months running both platforms | 1-2 months running old platform + new code |
| Risk of regression | Medium (selector mapping issues) | Lower (you control the rendering) |
| Future lock-in risk | Same (new vendor, same pattern) | Zero (code lives in your repo) |

Meanwhile, SaaS pricing keeps climbing. Year-over-year SaaS price inflation hit 8.7% in 2025, nearly 5x higher than general market inflation, while corporate IT budgets grew at just 2.8% ([SaaStr](https://www.saastr.com/the-great-price-surge-of-2025-a-comprehensive-breakdown-of-pricing-increases-and-the-issues-they-have-created-for-all-of-us/)). Pendo's enterprise pricing averages roughly $48,000 per year with renewal uplifts of 5-20%. Appcues and Userpilot run $300-$2,000 per month at mid-market scale.

And 60% of SaaS vendors deliberately mask their rising prices through packaging changes and feature bundling. The math gets worse every year you stay.

## The counterargument: when SaaS lock-in is worth accepting

I'd be dishonest if I didn't acknowledge the real advantages that come with accepting vendor lock-in.

**Visual builders save non-engineering time.** If your product team ships 20 tours per quarter and your engineers are fully allocated to core product work, a no-code builder that lets PMs iterate without engineering support has genuine value. The lock-in tax is the price you pay for that velocity, and sometimes it's worth paying.

**Mature analytics out of the box.** Pendo's analytics are genuinely good. Building equivalent funnel analysis and cohort tracking from scratch takes months. If onboarding analytics drive real business decisions at your company, the vendor's pipeline might justify the dependency.

**Established support and documentation.** When something breaks at 2am, Appcues has a support team. An open-source library has GitHub Issues. For teams without deep frontend expertise, that support contract provides real insurance.

**Speed to first value.** A PM can ship a tour in Appcues in 15 minutes. With Tour Kit or any code-based library, a developer needs to write JSX and deploy. For teams that need onboarding yesterday, SaaS wins the first sprint.

Lock-in always has costs. The question is whether the benefits justify the exit price you'll eventually pay. For teams with no frontend engineers, or those on non-React stacks, a SaaS platform might be the right trade-off. Tour Kit requires React 18+ and doesn't have a visual editor.

## What code-owned onboarding actually looks like

If you want to avoid vendor lock-in entirely, you need onboarding logic that lives in your codebase, deploys with your app, and uses your existing tools. [Tour Kit's architecture](https://usertourkit.com/docs/core) was designed around this principle. Here's a side-by-side of what "owned" versus "rented" onboarding looks like in practice.

```tsx
// src/components/OnboardingTour.tsx
// Your tours are React components — version controlled, code reviewed, type-safe
import { TourProvider, Tour, TourStep } from '@tourkit/react';

export function DashboardTour() {
  return (
    <TourProvider>
      <Tour tourId="dashboard-intro">
        <TourStep
          target="#revenue-chart"
          title="Your revenue at a glance"
          content="This chart updates in real time as new subscriptions come in."
        />
        <TourStep
          target="#user-table"
          title="Active users"
          content="Click any row to see that user's onboarding progress."
        />
      </Tour>
    </TourProvider>
  );
}
```

Tour definitions are TypeScript. They go through pull requests and get type-checked. They live in the same repo as the features they describe.

When you refactor a component, you refactor its tour step in the same PR. Delete a feature, and the tour step goes with it. No orphaned selectors pointing at elements that no longer exist.

Your analytics go wherever you send them. Tour Kit's [analytics package](https://usertourkit.com/docs/analytics) supports PostHog, Mixpanel, Amplitude, and GA4 as plugins. Switch providers without touching your tour logic.

The EU Data Act, which took effect in September 2025, now mandates data portability and access rights that prevent vendor lock-in for cloud services ([Modall](https://modall.ca/blog/saas-trends)). With code-owned onboarding, you don't need regulatory protection because there's no vendor holding your data in the first place.

## What we'd recommend for teams evaluating onboarding tools today

Start by answering one question: does your team have at least one frontend developer who can write React components? If yes, the lock-in risk of a SaaS platform likely outweighs the speed benefit, especially past year one. If no, a SaaS tool is the pragmatic choice until you hire frontend talent.

For teams with frontend capability, here's the migration-proof approach:

1. **Own your tour definitions in code.** Whether you use Tour Kit, Shepherd.js, or even build from scratch, keep the logic in your repository. Vendor dashboards are rented space.

2. **Own your analytics pipeline.** Send onboarding events to your existing analytics tool (PostHog, Mixpanel, whatever you already use). Don't let a second vendor own your user behavior data.

3. **Evaluate exit cost before entry cost.** Ask every onboarding vendor: "What format can I export my flows in? Can I run your export in a different system?" If the answer is "CSV of step titles," that's your lock-in signal.

4. **Budget for the migration you'll eventually need.** As of 2026, 35% of enterprises have already replaced at least one SaaS tool with a custom build, and 78% plan to build more this year ([Retool 2026 Build vs Buy Report](https://www.businesswire.com/news/home/20260217548274/en/)). The migration isn't hypothetical. Plan the engineering time now.

Check out [Tour Kit's documentation](https://tourkit.dev/docs) and the [live demo on StackBlitz](https://tourkit.dev/docs/examples) to see what code-owned onboarding looks like in practice.
