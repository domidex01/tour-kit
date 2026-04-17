---
title: "What is headless UI? A guide for onboarding engineers"
slug: "what-is-headless-ui-guide-onboarding"
canonical: https://usertourkit.com/blog/what-is-headless-ui-guide-onboarding
tags: react, javascript, web-development, accessibility
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-headless-ui-guide-onboarding)*

# What is headless UI? A guide for onboarding engineers

You have a design system. Your product tour library ships its own tooltips, its own colors, its own overlay. Now your onboarding flow looks like it belongs to a different app.

That's the headless UI problem. And if you work on onboarding, you've probably hit it.

This guide breaks down the headless component pattern, explains why it matters specifically for product tours and onboarding flows, and shows you how to apply it in practice.

## What is a headless UI component?

A headless UI component handles behavior and state without rendering any visual output. It provides the logic (event handling, keyboard navigation, focus management, ARIA attributes) and leaves the HTML and CSS entirely to the developer. Martin Fowler describes the pattern as extracting "all non-visual logic and state management, separating the brain of a component from its looks" ([martinfowler.com](https://martinfowler.com/articles/headless-component.html)). As of April 2026, the five major headless React libraries collectively have over 73,000 GitHub stars.

In React, headless components are almost always implemented as custom hooks. A `useTour()` hook handles step sequencing, progress tracking, and element targeting. You write the tooltip.

## Why it matters for onboarding

Product tour tools sit at a unique intersection of design and functionality. A tooltip that doesn't match your brand erodes trust during the exact moment you're trying to build it: first-run onboarding.

Traditional onboarding tools like Intro.js, Shepherd.js, and React Joyride all bundle pre-styled UI. As of April 2026, headless component adoption grew 70% year-over-year, driven largely by shadcn/ui and Radix Primitives ([Bitsrc](https://blog.bitsrc.io/headless-ui-libraries-for-react-top-5-e146145249fc)). Product tour libraries didn't keep up.

## The evolution: HOCs to render props to hooks

The headless pattern evolved through three phases:

1. **Higher-order components (2015-2018)** — HOCs wrapped a component to inject props, but created "wrapper hell"
2. **Render props (2018-2019)** — Better than HOCs, but verbose component trees ([LogRocket](https://blog.logrocket.com/the-complete-guide-to-building-headless-interface-components-in-react/))
3. **Custom hooks (2019-present)** — Clean separation, no wrappers, no indirection

```tsx
import { useTour } from '@tourkit/react';

function TourStep() {
  const { currentStep, next, back, isActive } = useTour();
  if (!isActive || !currentStep) return null;

  return (
    <div className="rounded-lg border bg-white p-4 shadow-lg">
      <h3 className="font-semibold">{currentStep.title}</h3>
      <p className="mt-1 text-sm text-gray-600">{currentStep.content}</p>
      <div className="mt-3 flex gap-2">
        <button onClick={back}>Back</button>
        <button onClick={next}>Next</button>
      </div>
    </div>
  );
}
```

## Headless vs styled comparison

| Dimension | Styled (React Joyride) | Headless (Tour Kit) |
|---|---|---|
| Bundle size (gzipped) | 37KB | Core <8KB, React <12KB |
| Match design system | Override 12+ CSS selectors | Use your own components |
| TypeScript coverage | Partial | Full |
| Accessibility | Basic ARIA | WCAG 2.1 AA |

## The design system test

Simple heuristic: if your app has a design system, you need a headless tour library. Design systems exist to enforce visual consistency. A styled tour library breaks that consistency at exactly the wrong moment.

## Key takeaways

- A headless UI component separates behavior from rendering
- The pattern evolved from HOCs to render props to hooks
- If your app has a design system, headless onboarding tools avoid CSS specificity fights
- Accessibility comes free with a good headless library

Full article with comparison tables and more code examples: [usertourkit.com/blog/what-is-headless-ui-guide-onboarding](https://usertourkit.com/blog/what-is-headless-ui-guide-onboarding)
