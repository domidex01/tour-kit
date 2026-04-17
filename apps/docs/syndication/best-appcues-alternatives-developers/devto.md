---
title: "7 Appcues alternatives that won't cost you $249/month"
published: false
description: "Appcues starts at $249/mo and injects a 180KB script. We compared 7 developer-friendly alternatives by bundle size, React 19 support, accessibility, and pricing."
tags: react, javascript, webdev, opensource
canonical_url: https://usertourkit.com/blog/best-appcues-alternatives-developers
cover_image: https://usertourkit.com/og-images/best-appcues-alternatives-developers.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-appcues-alternatives-developers)*

# What are the best Appcues alternatives for developers?

Appcues starts at $249 per month, injects a ~180 KB third-party script outside your React component tree, and gates custom CSS behind its Growth plan. If your engineering team wants to own the onboarding experience in code rather than hand it to a product manager with a visual builder, seven alternatives give you more control for less money.

We built Tour Kit, one of the tools on this list. Take our recommendations with that context. Every data point below is verifiable against npm, GitHub, or the vendor's public pricing page.

```bash
npm install @tourkit/core @tourkit/react
```

## Short answer

The best Appcues alternative for developers depends on your constraints. Tour Kit gives React teams full design control at 8.1 KB gzipped with zero runtime dependencies, MIT-licensed, and $99 one-time for Pro features. Flows.sh is strong if you want a managed service with a developer-first API. React Joyride works for quick prototypes that don't need React 19. If bundle size matters most, Driver.js ships at 5 KB but requires DOM manipulation outside React's model.

## Why developers leave Appcues

Three patterns come up repeatedly on Reddit and in GitHub discussions.

**Pricing scales fast.** Appcues charges per monthly active user. A SaaS app with 5,000 MAUs pays roughly $249-$399/month on the Essentials plan, and at 10,000 MAUs you're looking at Growth pricing with custom quotes. One Reddit user put it plainly: "They've gotten insanely expensive" ([r/SaaS](https://reddit.com/r/SaaS)). That's $2,988/year minimum before you hit any feature add-on.

**Customization requires developer help anyway.** Appcues markets a no-code builder, but real customization needs CSS overrides and sometimes JavaScript callbacks. Custom CSS is gated behind the Growth plan, so teams on Essentials either accept default styling or pay to upgrade.

If your developers are doing the customization work regardless, the visual builder adds overhead without saving time.

**Third-party script injection.** Appcues loads via an external `<script>` tag. That ~180 KB payload sits outside your React tree, can't participate in your component lifecycle, and creates a dependency on Appcues' CDN uptime. For teams shipping performance-sensitive React apps, this is a real concern — Google's Core Web Vitals documentation on [web.dev](https://web.dev/vitals/) specifically flags third-party script impact on Largest Contentful Paint.

## Comparison table

| Tool | Type | Bundle / Script | React 19 | WCAG 2.1 AA | Price | Best for |
|------|------|----------------|----------|-------------|-------|----------|
| Tour Kit | Library | ~8 KB gzipped | ✅ | ✅ | $0 MIT / $99 one-time Pro | React devs who want code ownership |
| Flows.sh | Managed service | SDK-based | ✅ | ✅ | Free tier / paid plans | Teams wanting managed infra + dev API |
| React Joyride | Library | ~45 KB gzipped | ❌ | Partial | Free (MIT) | Quick prototypes, legacy React apps |
| Shepherd.js | Library | ~25 KB gzipped | Via wrapper | Partial | Free (AGPL) / Commercial license | Multi-framework teams (Vue, Angular, React) |
| Driver.js | Library | ~5 KB gzipped | No React wrapper | ❌ | Free (MIT) | Minimal spotlight highlighting |
| Intro.js | Library | ~15 KB gzipped | No React wrapper | Partial | Free (AGPL) / $9.99+ commercial | Simple step-by-step introductions |
| OnboardJS | Library + SaaS | SDK-based | ✅ | ✅ | Free (OSS) / $59/mo SaaS | Headless + managed analytics |

As of April 2026, React Joyride has ~603,000 weekly npm downloads but hasn't shipped React 19 support due to its class component architecture. Shepherd.js uses an AGPL license that requires you to open-source your entire application or buy a commercial license.

## Decision framework

**If you need full design control with your existing design system:** Tour Kit. It renders your components, not its own. Works with shadcn/ui, Radix, Tailwind, or whatever you ship. Headless architecture means you own every pixel.

```tsx
// src/components/OnboardingTour.tsx
import { TourProvider, Tour, TourStep } from '@tourkit/react';

export function OnboardingTour() {
  return (
    <TourProvider>
      <Tour tourId="welcome">
        <TourStep target="#dashboard-nav" title="Navigation">
          Your main dashboard lives here. Click any section to explore.
        </TourStep>
        <TourStep target="#create-button" title="Create your first project">
          Hit this button to get started with your first project.
        </TourStep>
      </Tour>
    </TourProvider>
  );
}
```

**If you want managed infrastructure without building a backend:** Flows.sh. Their SDK integrates into your codebase, but analytics, targeting, and content management live on their platform. Developers get versioning, environments, and API access instead of a drag-and-drop builder pretending to replace code.

**If you're prototyping and don't need React 19:** React Joyride. Biggest install base in the category with tons of Stack Overflow answers. Works out of the box.

But know that you'll likely outgrow it. Inline styles conflict with design systems, controlled mode is poorly documented, and the class component architecture means no migration path to React 19.

**If you need multi-framework support:** Shepherd.js. First-class wrappers for Vue, Angular, and Ember alongside React. Read the license carefully though. AGPL-3.0 means your entire application must be open-sourced unless you purchase a commercial license from Ship Shape, and that cost isn't publicly listed.

**If bundle size is the only thing that matters:** Driver.js at ~5 KB gzipped. Smallest in the category. But it's vanilla JavaScript with direct DOM manipulation, which means fighting the virtual DOM in a React app with no component composition and no state management integration. Tour Kit's core is 8 KB and stays inside React's model.

**If you want open-source headless with managed analytics:** OnboardJS offers a similar headless approach to Tour Kit with built-in PostHog and Supabase plugins. The trade-off is $59/month recurring versus Tour Kit's $99 one-time.

## What we recommend

For a React team replacing Appcues, start with Tour Kit's free MIT tier. You get the core tour engine, step sequencing, keyboard navigation, and WCAG 2.1 AA accessibility out of the box. Want analytics, scheduling, surveys, and advanced components? The Pro license costs $99 one-time, which is still less than a single month of Appcues Essentials.

Tour Kit has real limitations worth knowing. There's no visual builder, so your team needs React developers to create and modify tours. No mobile SDK either.

The community is smaller than React Joyride or Shepherd.js, and as a younger project it has less battle-testing at enterprise scale.

If your team doesn't write React and needs a visual builder, Appcues might actually be the right choice. Not every team needs code ownership. But if you're reading an article titled "Appcues alternatives for developers," you probably do.

Full docs and live examples: [usertourkit.com](https://usertourkit.com/)

```bash
npm install @tourkit/core @tourkit/react
```

## FAQ

### Is Tour Kit a direct Appcues replacement?

Tour Kit replaces Appcues' product tour and onboarding flow features. It doesn't cover the visual builder, user segmentation, or NPS surveys (though `@tourkit/surveys` handles surveys). For analytics, pair it with PostHog, Mixpanel, or your existing stack.

### How much does Appcues cost compared to open-source alternatives?

Appcues Essentials starts at $249 per month for up to 2,500 MAUs, which totals $2,988 per year minimum. Tour Kit's core is MIT-licensed and free, with Pro at $99 one-time. React Joyride and Driver.js are both MIT and free. Shepherd.js is free under AGPL but requires a commercial license for proprietary apps.

### Can I migrate from Appcues to Tour Kit incrementally?

Yes. Install Tour Kit alongside Appcues, rebuild one tour at a time, then remove the Appcues script when you're done. They don't conflict since Tour Kit renders React components while Appcues injects DOM elements via script. Budget 2-4 hours per tour. See our [migration guide](https://usertourkit.com/blog/migrate-appcues-code-owned-onboarding) for details.

### Does Appcues work with React 19?

Appcues injects its UI via a third-party script rather than rendering React components, so it doesn't break on React 19. But it also can't use React 19 features like concurrent rendering, transitions, or Server Components. The injected elements sit outside your React tree entirely. Tour Kit is built natively for React 18 and 19.

### What's the bundle size difference between Appcues and Tour Kit?

Appcues loads a ~180 KB third-party script on every page. Tour Kit's core ships at 8.1 KB gzipped with zero runtime dependencies. That's a 22x difference, which matters for Core Web Vitals on mobile where Google's [web.dev](https://web.dev/vitals/) recommends keeping total JavaScript under 300 KB.
