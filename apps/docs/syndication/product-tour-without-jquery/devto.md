---
title: "Every Product Tour Library Dropped jQuery — Here's What Actually Differentiates Them Now"
published: false
description: "jQuery is gone from every major tour library. The real differences in 2026 are bundle size, licensing traps, and whether you get accessibility for free. Comparison of 6 options."
tags: react, javascript, webdev, opensource
canonical_url: https://usertourkit.com/blog/product-tour-without-jquery
cover_image: https://usertourkit.com/og-images/product-tour-without-jquery.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-without-jquery)*

# What product tour tool works without jQuery?

jQuery was the standard for a decade. But if you're building with React, Vue, or any modern framework in 2026, dragging in a 30 KB dependency for DOM manipulation you already have is a hard sell. The good news: every serious product tour library dropped jQuery years ago.

The real question isn't "which tool works without jQuery?" but which jQuery-free library fits your stack, your licensing constraints, and your performance budget.

```bash
npm install @tourkit/core @tourkit/react
```

## Short answer

Every major product tour library in 2026 works without jQuery. Driver.js, Intro.js, Shepherd.js, React Joyride, and Tour Kit all ship zero jQuery dependencies. The only libraries that still require jQuery are effectively dead: Bootstrap Tour (last meaningful update 2019) and Trip.js (archived). If you're on React, Tour Kit's core ships at under 8 KB gzipped with full TypeScript support and WCAG 2.1 AA accessibility built in. For vanilla JavaScript projects, Driver.js is the lightest option at roughly 25 KB gzipped.

## Why jQuery left the product tour conversation

GitHub publicly removed jQuery from its frontend in 2018, and the signal rippled through the ecosystem ([CSS-Tricks](https://css-tricks.com/removing-jquery-from-github-com-frontend/)). jQuery usage among Stack Overflow survey respondents dropped from 43% in 2020 to around 22% by 2023. As of April 2026, W3Techs still finds jQuery on about 78% of the top 1 million sites — but virtually all of that is legacy code, not new projects.

jQuery 4 shipped in early 2026 ([InfoQ](https://www.infoq.com/news/2026/02/jquery-4-release/)). It's a maintenance release for existing codebases, not a reason to adopt jQuery in a new React or Next.js app. Supporting jQuery 4 doesn't make a library modern. It extends legacy debt.

As one developer put it: "jQuery and Bootstrap dependencies are outdated for modern web applications, and Bootstrap Tour is largely unmaintained" ([Flows.sh](https://flows.sh/alternatives/bootstrap-tour)). Teams migrating off these legacy tools now have several mature alternatives.

Three concrete problems with jQuery-dependent tour libraries:

1. **Bundle bloat.** jQuery adds roughly 30 KB min+gzipped on top of whatever the tour library itself weighs
2. **Virtual DOM conflicts.** jQuery manipulates the real DOM directly, which fights React's reconciler and causes stale-reference bugs
3. **CSP violations.** jQuery's internal patterns can trip strict Content Security Policy headers on security-conscious apps

## jQuery-free product tour libraries compared

Here's how the current options stack up. All data verified against npm and Bundlephobia as of April 2026.

| Library | jQuery? | Gzip size | License | React support | Accessibility |
|---------|---------|-----------|---------|---------------|---------------|
| Tour Kit | No | <8 KB (core) | MIT | Native hooks + components | WCAG 2.1 AA, focus trap, aria-live |
| Driver.js | No | ~25 KB | MIT | Manual refs + useEffect | Basic ARIA attributes |
| React Joyride v3 | No | ~37 KB | MIT | Native React component | Partial (no focus trap) |
| Intro.js | No | ~10 KB | AGPL v3 | Community wrapper | Basic ARIA attributes |
| Shepherd.js | No | ~35 KB | AGPL v3 | Community wrapper | Basic ARIA attributes |
| Reactour | No | ~15 KB | MIT | Native React component | Partial |

A common misconception: Intro.js has been around since 2013, right alongside the jQuery era, so developers assume it requires jQuery. It never did. The confusion comes from jQuery's own repo containing a file called `intro.js` (completely unrelated). Worth knowing if you see conflicting search results.

## The AGPL licensing trap

Intro.js and Shepherd.js are licensed under AGPL v3. If you're building closed-source SaaS (and most of us are), that means you need a commercial license. The AGPL requires you to release your entire application's source code to users if you deploy it as a network service.

As one comparison put it: "Licensing is the primary differentiator" between the MIT options (Driver.js, Reactour, Tour Kit) and the AGPL ones ([Inline Manual](https://inlinemanual.com/blog/driverjs-vs-introjs-vs-shepherdjs-vs-reactour/)).

This isn't a technicality. It's a real business risk that most "best product tour library" roundups skip over entirely.

## Decision framework: which jQuery-free library fits your project?

**If you need a vanilla JavaScript solution with no framework:** Driver.js. It's the lightest option, works anywhere, and the MIT license keeps things simple. But you'll wire up refs and lifecycle hooks yourself in React.

**If you're already on React and want the fastest setup:** React Joyride v3. It has the largest community (340K+ weekly npm downloads) and the v3 rewrite replaced Popper.js with `@floating-ui/react-dom` for better positioning. The tradeoff is the 37 KB gzip footprint.

**If you want headless architecture with full design control:** Tour Kit. No shipped CSS, no opinionated components. You render steps with your own UI: Tailwind, shadcn/ui, Radix, whatever your design system uses. Core is under 8 KB gzipped.

**If bundle size is your only concern and you're not building SaaS:** Intro.js at roughly 10 KB gzipped. Just check whether the AGPL license works for your situation first.

**If you need the tour to survive SPA route changes:** This is the pain point nobody talks about. It's the #1 reported issue across Shepherd.js, React Joyride, and Driver.js on GitHub. Tours break when users navigate mid-tour in React Router or Next.js App Router. Tour Kit handles route-aware step transitions natively through its phase-based architecture.

## What "jQuery-free" doesn't tell you

Dropping jQuery is the baseline, not the finish line. All six libraries in the table above are jQuery-free. The differences that actually matter in 2026:

**Headless vs. opinionated.** Most jQuery-free libraries still ship their own CSS and tooltip components. That's fine until your design system has its own tooltip, its own popover, its own modal. Then you're overriding styles or replacing components entirely. A headless library gives you the tour logic (positioning, step sequencing, keyboard navigation) without prescribing any UI.

**Accessibility compliance.** The W3C ARIA Authoring Practices Guide specifies that tour-style dialogs need `role="dialog"`, focus trapping, `aria-live` regions for dynamic content, and keyboard dismiss with Escape. Most libraries provide basic `aria-describedby` attributes and stop there. We tested: Tour Kit is the only library in this comparison that ships focus trapping and live region announcements out of the box.

**TypeScript support.** Driver.js and Tour Kit are written in TypeScript with full type exports. React Joyride v3 ships types too. Intro.js and Shepherd.js rely on community-maintained type definitions that can lag behind releases, which means you might hit type mismatches after a library update. If your project runs TypeScript strict mode, this matters more than you'd think.

```tsx
// src/components/OnboardingTour.tsx
import { TourProvider, useTour } from '@tourkit/react';

const steps = [
  { target: '[data-tour="inbox"]', content: 'Your messages land here.' },
  { target: '[data-tour="compose"]', content: 'Start a new message.' },
];

function TourButton() {
  const { start } = useTour();
  return <button onClick={() => start()}>Start tour</button>;
}

export function OnboardingTour({ children }: { children: React.ReactNode }) {
  return (
    <TourProvider steps={steps}>
      {children}
      <TourButton />
    </TourProvider>
  );
}
```

## What we recommend (and our bias)

We built Tour Kit, so factor that into what follows. Every claim here is verifiable against [npm](https://www.npmjs.com/), [GitHub](https://github.com/), and [Bundlephobia](https://bundlephobia.com/).

For React teams that care about performance, accessibility, and design system integration: Tour Kit gives you the most control at the smallest size. It won't work if you need vanilla JS support or a visual tour builder. It's React 18+ only and requires developers to write JSX.

For teams that just need a quick overlay tour and don't mind shipped CSS: React Joyride v3 is battle-tested with the largest ecosystem.

For non-React projects: Driver.js. Honest pick, even from us.

Get started with Tour Kit: [usertourkit.com](https://usertourkit.com/)

```bash
npm install @tourkit/core @tourkit/react
```

## FAQ

### Do any product tour libraries still require jQuery in 2026?

Only abandoned ones. Bootstrap Tour and Trip.js still list jQuery as a dependency, but neither has received updates since 2019. Every actively maintained product tour library (Driver.js, Intro.js, Shepherd.js, React Joyride, Reactour, and Tour Kit) works without jQuery and has for years. If a tutorial recommends a jQuery-based tour library, check when it was written.

### Is Driver.js better than Intro.js for a product tour without jQuery?

Both are jQuery-free, but they differ in two ways that matter. Driver.js is MIT licensed, so you can use it in closed-source SaaS without buying a commercial license. Intro.js uses AGPL v3, which requires either open-sourcing your app or purchasing a license. Driver.js is also framework-agnostic and written in TypeScript, while Intro.js targets vanilla JS with community-maintained type definitions.

### Can I use React Joyride without jQuery?

Yes. React Joyride has never required jQuery. Version 3 is a complete rewrite that replaced its older Popper.js dependency with `@floating-ui/react-dom`, making it lighter and more compatible with modern React patterns. It adds roughly 37 KB gzipped to your bundle based on real-world measurements.

### What is the lightest product tour library without jQuery?

Tour Kit's core package ships at under 8 KB gzipped with zero runtime dependencies. Among non-React options, Intro.js comes in at roughly 10 KB gzipped (but carries AGPL licensing). Driver.js lands at approximately 25 KB gzipped. These are gzipped transfer sizes, not unpacked npm sizes. That's an important distinction that most comparison articles skip.

### Does jQuery 4 change anything for product tour libraries?

No. jQuery 4, released in early 2026, is a maintenance update for existing codebases. It doesn't change the fundamental architectural mismatch between jQuery's direct DOM manipulation and React's virtual DOM. No new product tour library is adopting jQuery 4 as a dependency. If you're evaluating tour libraries for a new project, jQuery's version number is irrelevant to your decision.
