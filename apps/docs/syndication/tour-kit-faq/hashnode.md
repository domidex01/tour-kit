---
title: "Tour Kit FAQ: everything developers ask before installing"
slug: "tour-kit-faq"
canonical: https://usertourkit.com/blog/tour-kit-faq
tags: react, javascript, web-development, typescript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-faq)*

# Tour Kit FAQ: everything developers ask before installing

You found a product tour library. The README looks promising. But before you `npm install`, you have questions. Does it actually work with React 19? Will it fight your Tailwind setup? What's the catch with the free tier?

We built Tour Kit, so we're biased. We're also the best people to answer these questions honestly, because we know where the sharp edges are. Every claim below is verifiable against npm, GitHub, or bundlephobia.

```bash
npm install @tourkit/core @tourkit/react
```

## What is Tour Kit?

Tour Kit is an open-source, headless product tour library for React. It ships as 10 composable packages, so you install only what you need. The core package is under 8KB gzipped with zero runtime dependencies. It handles tour logic (step sequencing, element targeting, scroll handling, focus management) without rendering any UI. You bring your own components.

## Does Tour Kit work with React 19?

Tour Kit supports React 18 and React 19 natively, including concurrent features and the new use hook. As of April 2026, React Joyride "hasn't been updated in 9 months and isn't compatible with React 19" ([Sandro Roth](https://sandroroth.com/blog/evaluating-tour-libraries/)). If you're on React 19, check whether your tour library actually runs on it before installing.

```tsx
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

## How big is the bundle?

| Library | Size (gzipped) | Dependencies |
|---------|---------------|--------------|
| Driver.js | ~5KB | Zero |
| Tour Kit (core) | <8KB | Zero |
| Tour Kit (core + react) | ~12KB | React (peer) |
| Reactour | ~15KB | Few |
| React Joyride | ~45KB (498KB unpacked) | React Floater, Popper |

## Does it work with Tailwind and shadcn/ui?

Yes. Tour Kit renders nothing. You pass your own shadcn/ui components. No CSS specificity wars. React Joyride "relies on inline styles without custom class name support," forcing component overrides for Tailwind teams.

## How is accessibility handled?

Tour Kit targets WCAG 2.1 AA compliance with proper ARIA attributes, focus trapping, keyboard navigation, and `prefers-reduced-motion` support.

## Tour Kit vs React Joyride

| Feature | Tour Kit | React Joyride |
|---------|----------|---------------|
| Architecture | Headless (hooks + providers) | Styled (opinionated UI) |
| Bundle size | <8KB core | 498KB unpacked |
| React 19 | Native support | Not updated in 9+ months |
| Tailwind | Render your own components | Requires overrides |
| License | MIT (free) + Pro ($99 one-time) | MIT (free) |

## Is Tour Kit free?

Core packages are MIT-licensed and free for commercial use. Extended packages require a Pro license at $99 one-time per project.

---

Full article with all 20 questions and code examples: [usertourkit.com/blog/tour-kit-faq](https://usertourkit.com/blog/tour-kit-faq)
