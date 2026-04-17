---
title: "Pendo vs Appcues vs Open Source: which onboarding tool fits your team?"
published: false
description: "A decision framework for choosing between Pendo ($48K/yr median), Appcues ($879/mo+), and open-source libraries (<8KB). Real pricing data, no fluff."
tags: react, javascript, webdev, opensource
canonical_url: https://usertourkit.com/blog/pendo-vs-appcues-vs-open-source
cover_image: https://usertourkit.com/og-images/pendo-vs-appcues-vs-open-source.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/pendo-vs-appcues-vs-open-source)*

# How to choose between Pendo, Appcues, and an open-source library

Three paths, three tradeoffs. Pendo gives you analytics-first onboarding with enterprise pricing. Appcues gives you a no-code builder with MAU-based billing. Open-source libraries hand you full control at zero recurring cost.

The right pick depends on who edits your tours and how much you're willing to pay per active user. It also depends on whether you need your onboarding code to live inside your codebase.

We built [Tour Kit](https://usertourkit.com/) as an open-source option, so factor that bias into everything below. Every number is verifiable against public sources.

```bash
npm install @tourkit/core @tourkit/react
```

## Short answer

Pendo fits product-led enterprise teams with $25K+ budgets who need combined analytics and in-app guidance under one vendor. Appcues fits product managers who want a visual builder and can absorb $3,000-$18,000 per year in MAU-based pricing that grows with their user base. Open-source libraries like Tour Kit fit engineering-led teams who want sub-10KB bundles, full design system control, and predictable costs that don't scale with user count. As of April 2026, Pendo's median contract sits at $48,463/year ([Vendr marketplace data](https://www.vendr.com/marketplace/pendo)), Appcues Growth starts at $879/month for 2,500 MAU ([Userorbit, 2026](https://userorbit.com/blog/appcues-pricing-guide)), and Tour Kit ships at under 8KB gzipped with an MIT license.

## How the three approaches actually compare

The core difference isn't features. It's who owns the onboarding experience and where the code runs. Pendo and Appcues inject third-party JavaScript into your app at runtime. Open-source libraries compile into your bundle and ship as part of your codebase.

That distinction drives everything else: performance impact, design flexibility, data ownership, and long-term cost.

| Criteria | Pendo | Appcues | Open source (Tour Kit) |
|---|---|---|---|
| Pricing model | Enterprise contracts, $15.9K-$48K+/yr | MAU-based, $3K-$24K/yr at 10K MAU | Free (MIT) or $99 one-time Pro |
| Script size | ~300KB+ agent script | ~200KB+ injected bundle | Under 8KB gzipped (core) |
| Visual builder | Yes (Chrome extension) | Yes (Chrome extension) | No (code-first) |
| Built-in analytics | Yes (product analytics platform) | Basic (flow completion, NPS) | Plugin-based (PostHog, Mixpanel, GA4) |
| Design system control | Limited (CSS overrides) | Limited (template-based) | Full (headless, render your own JSX) |
| Accessibility | Partial WCAG support | Partial WCAG support | WCAG 2.1 AA built-in |
| Data residency | Pendo cloud (US/EU) | Appcues cloud (US) | Your infrastructure |
| Who edits tours | PMs and CSMs via browser | PMs via browser | Developers via code |

## When Pendo is the right call

Pendo makes sense when your organization already uses it for product analytics and you want guides layered on top of that data. The analytics-guides integration is Pendo's real product. Tours are the side dish.

Pick Pendo if your team has $25K+ annual budget for a combined analytics-and-guidance platform and needs retroactive analytics on features shipped months ago without adding instrumentation code. PMs can build guides targeting specific user segments without engineering involvement. As of April 2026, Pendo for Startups costs $7,000/year but graduates to $25K-$35K Base tier pricing ([Featurebase, 2026](https://www.featurebase.app/blog/pendo-pricing)).

The tradeoff: Pendo's in-app guides are secondary to its analytics product. The guide builder is functional but not where Pendo focuses its engineering investment. You're paying enterprise rates for analytics that happen to include tours. Already running PostHog or Mixpanel? You're duplicating analytics spend.

## When Appcues is the right call

Appcues is built for product teams that want to ship onboarding flows without writing code. The visual builder works through a Chrome extension, and non-technical PMs can create, test, and publish flows without a deploy cycle.

Pick Appcues if your product manager edits tours weekly and can't wait for engineering sprints. It works well when you're running 10+ flows with audience segmentation and your MAU count is stable enough that $879/month at 2,500 MAU fits the budget. Appcues Essentials starts at $249/month but restricts you to 3 user segments and 5 audience targets ([Appcues pricing page, April 2026](https://www.appcues.com/pricing)).

The tradeoff: you give up design control. Appcues tours look like Appcues tours. CSS overrides help, but matching a custom design system means fighting the tool.

MAU pricing also means your onboarding cost grows with success. A startup going from 5K to 50K MAU watches their bill 10x while the onboarding flows stay the same.

## When open source is the right call

Open-source libraries work when engineering owns the onboarding experience and wants it to behave like any other component in the codebase. No third-party scripts. No MAU billing. No vendor lock-in on your own product's first impression.

Pick an open-source library if you have React developers who can write JSX and need your tours to match your design system exactly. Performance matters too: sub-10KB vs 200-300KB injected scripts. If you require WCAG 2.1 AA compliance without workarounds, or you're a startup where $3,600-$48,000/year for onboarding tooling doesn't add up, open source is the pragmatic choice.

Tour Kit's headless architecture means you render the UI. The library handles positioning, step sequencing, keyboard navigation, and scroll management. You get `useTour()` and `useStep()` hooks instead of a black-box widget.

```tsx
// src/components/OnboardingTour.tsx
import { TourProvider, Tour, TourStep } from '@tourkit/react';

function OnboardingTour() {
  return (
    <TourProvider>
      <Tour tourId="welcome">
        <TourStep
          target="#dashboard-nav"
          content={({ next }) => (
            <div className="rounded-lg bg-white p-4 shadow-lg">
              <p>Start here to explore your dashboard.</p>
              <button onClick={next}>Next</button>
            </div>
          )}
        />
      </Tour>
    </TourProvider>
  );
}
```

The tradeoff: no visual builder. Your PM can't drag-and-drop a tooltip into existence. Every tour change requires a code change and a deploy.

Tour Kit is young and has a smaller community than React Joyride's 603K weekly npm downloads. If you need battle-tested enterprise scale, that's a fair concern.

## The decision framework

Skip the feature matrices. Ask three questions:

**Who edits tours?** If it's PMs who don't write code, use Appcues. If it's developers, use open source. If it's a product analytics team that also wants guides, use Pendo.

**What's your annual budget?** Under $1,000/year, open source is the only realistic option. $3,000-$15,000/year, Appcues Essentials or Growth. Over $25,000/year, Pendo or Appcues Enterprise.

**Does performance matter?** If your app runs on mobile or has strict Core Web Vitals targets, injecting 200-300KB of third-party JavaScript will show up in Lighthouse. Open-source libraries that compile into your bundle tree-shake to only the code you use.

| Your situation | Best fit | Why |
|---|---|---|
| PM-led, 20+ flows, stable budget | Appcues | Visual builder, no deploy needed |
| Enterprise, analytics-first | Pendo | Guides + analytics in one contract |
| Engineering-led, React codebase | Open source | Full control, zero recurring cost |
| Startup, under 10K MAU | Open source | Budget preservation, no MAU scaling |
| Design system team, Tailwind/shadcn | Open source | Headless rendering, design token support |
| HIPAA/SOC2, data residency required | Open source | No third-party data transmission |

## FAQ

### Is Pendo worth it for a small team?

Pendo's value is analytics-plus-guides in one platform. For teams under 50 employees, the $25K-$48K annual cost often exceeds what onboarding alone justifies. Pendo for Startups at $7,000/year is more reasonable, but you graduate to standard pricing after Series B.

### Can Appcues match a custom design system?

Appcues provides CSS customization, but components render inside Appcues' own DOM layer, not your React tree. Matching a Tailwind or shadcn/ui design system requires significant CSS overrides. Headless libraries like Tour Kit render inside your component tree, so existing styles apply natively.

### What are the best open-source alternatives to Pendo and Appcues?

Tour Kit (under 8KB, MIT, headless) and React Joyride (37KB, MIT, 603K weekly downloads) lead the React space. Shepherd.js is capable but uses an AGPL license. Driver.js (5KB, MIT) covers basics.

### Do Pendo and Appcues affect page performance?

Both inject third-party JavaScript at runtime: Pendo adds roughly 300KB, Appcues around 200KB. These scripts consume main-thread time during initialization, impacting Time to Interactive and Interaction to Next Paint. Open-source libraries compile into your bundle and tree-shake to as little as 8KB gzipped.

### Can I migrate from Pendo or Appcues to open source later?

Yes, but the migration cost depends on how many flows you've built. Pendo and Appcues store tour configurations in their cloud, not your codebase. Migrating means rebuilding each flow in code. Budget 2-4 hours per flow for a typical migration.
