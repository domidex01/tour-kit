---
title: "20 questions developers ask before installing a React product tour library"
published: false
description: "React 19 support? Bundle size? Tailwind compatibility? We answered every question we get asked about Tour Kit, with data and code examples."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/tour-kit-faq
cover_image: https://usertourkit.com/og-images/tour-kit-faq.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-faq)*

# Tour Kit FAQ: everything developers ask before installing

You found a product tour library. The README looks promising. But before you `npm install`, you have questions. Does it actually work with React 19? Will it fight your Tailwind setup? What's the catch with the free tier?

We built Tour Kit, so we're biased. We're also the best people to answer these questions honestly, because we know where the sharp edges are. Every claim below is verifiable against npm, GitHub, or bundlephobia.

```bash
npm install @tourkit/core @tourkit/react
```

Here are the questions developers ask most, organized by when they come up in the evaluation process.

## What is Tour Kit?

Tour Kit is an open-source, headless product tour library for React. It ships as 10 composable packages, so you install only what you need. The core package is under 8KB gzipped with zero runtime dependencies. It handles tour logic (step sequencing, element targeting, scroll handling, focus management) without rendering any UI. You bring your own components.

## Does Tour Kit work with React 19?

Tour Kit supports React 18 and React 19 natively, including concurrent features and the new use hook. React 19 Server Components are stable and "will not break between minor versions" ([React Official Blog](https://react.dev/blog/2024/12/05/react-19)).

This matters because the most popular alternative hasn't kept up. As of April 2026, React Joyride "hasn't been updated in 9 months and isn't compatible with React 19" ([Sandro Roth](https://sandroroth.com/blog/evaluating-tour-libraries/)). If you're on React 19, check whether your tour library actually runs on it before installing.

```tsx
// src/components/ProductTour.tsx
'use client';

import { TourProvider, useTour } from '@tourkit/react';

const steps = [
  { id: 'welcome', target: '#dashboard-header', title: 'Welcome', content: 'Start here.' },
  { id: 'sidebar', target: '#nav-sidebar', title: 'Navigation', content: 'Find your way around.' },
];

function TourContent() {
  const { currentStep, nextStep, isActive } = useTour();
  if (!isActive) return null;
  return <YourTooltipComponent step={currentStep} onNext={nextStep} />;
}

export function ProductTour({ children }: { children: React.ReactNode }) {
  return <TourProvider steps={steps}>{children}<TourContent /></TourProvider>;
}
```

## Does it work with Next.js App Router?

Yes, fully supported. Components that use `TourProvider` need the `'use client'` directive because product tours are inherently client-side. Create a client component that wraps `TourProvider` and lazy-load it so tour code stays out of the server bundle.

```tsx
// app/layout.tsx
import dynamic from 'next/dynamic';

const ProductTour = dynamic(() => import('@/components/ProductTour'), { ssr: false });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}<ProductTour /></body>
    </html>
  );
}
```

## How big is the bundle?

Tour Kit's core package is under 8KB gzipped with zero runtime dependencies. The React package adds roughly 4KB.

| Library | Size (gzipped) | Dependencies |
|---------|---------------|--------------|
| Driver.js | ~5KB | Zero |
| Tour Kit (core) | <8KB | Zero |
| Tour Kit (core + react) | ~12KB | React (peer) |
| Reactour | ~15KB | Few |
| React Joyride | ~45KB (498KB unpacked) | React Floater, Popper |

**Tour Kit limitation:** if your only requirement is a highlight overlay with no React integration, Driver.js at ~5KB is lighter.

## Does it support TypeScript?

Tour Kit is written in TypeScript with strict mode enabled. Every public API exports its types. Full IntelliSense for step definitions, hook return values, and provider props without installing separate `@types/` packages.

```tsx
const steps = [
  { id: 'step-1', target: '#header', title: 'Welcome' },
  { id: 'step-2', target: '#sidebar', title: 'Navigate' },
] as const;

// useTour() returns typed state, no manual type annotations needed
const { currentStep, goToStep } = useTour();
// currentStep.id is typed as 'step-1' | 'step-2'
```

## Does it work with Tailwind and shadcn/ui?

Yes, and this is one of the main reasons Tour Kit exists. React Joyride "relies on inline styles without custom class name support" ([Sandro Roth](https://sandroroth.com/blog/evaluating-tour-libraries/)), which means overriding styles requires replacing the entire tooltip component.

Tour Kit renders nothing. You pass your own shadcn/ui `<Card>`, your own `<Button>`. No CSS specificity wars.

## How is accessibility handled?

Tour Kit targets WCAG 2.1 AA compliance. Every tour step receives proper `aria-labelledby` and `aria-describedby` attributes. Focus is trapped within the active tooltip during keyboard navigation. Users can navigate with Tab, Escape to dismiss, and arrow keys to move between steps.

An audit of Intro.js found "popovers lack `aria-labelledby` and `aria-describedby` attributes, buttons are implemented as links with `role='button'` rather than actual button elements, and there's no focus trap for keyboard navigation" ([Sandro Roth](https://sandroroth.com/blog/evaluating-tour-libraries/)).

## Tour Kit vs React Joyride

| Feature | Tour Kit | React Joyride |
|---------|----------|---------------|
| Architecture | Headless (hooks + providers) | Styled (opinionated UI) |
| Bundle size | <8KB core, ~12KB with React | 498KB unpacked |
| React 19 | Native support | Not updated in 9+ months |
| Tailwind / shadcn/ui | Render your own components | Requires component overrides |
| Community size | Smaller (newer project) | Large (400K+ weekly downloads) |
| License | MIT (free) + Pro ($99 one-time) | MIT (free) |

We built Tour Kit, so take this comparison with appropriate skepticism.

## What license does Tour Kit use?

Tour Kit's core packages (`@tourkit/core`, `@tourkit/react`, `@tourkit/hints`) are MIT-licensed. Free for commercial use. Extended packages require a Pro license at $99 one-time per project. No per-MAU pricing.

## Is Tour Kit free?

Core packages are MIT-licensed and free for commercial use. Extended packages for analytics, checklists, surveys, and media require a Pro license at $99 one-time per project. No per-user or per-MAU pricing.

## Does Tour Kit collect any user data?

No. Tour Kit runs entirely in the browser. It doesn't phone home, doesn't collect telemetry, and doesn't require an account. Tour state is stored wherever you configure it.

---

Full article with all 20 questions, comparison tables, and code examples: [usertourkit.com/blog/tour-kit-faq](https://usertourkit.com/blog/tour-kit-faq)
