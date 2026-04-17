---
title: "Headless onboarding: what it means, why it matters, and how to start"
slug: "headless-onboarding-explained"
canonical: https://usertourkit.com/blog/headless-onboarding-explained
tags: react, typescript, web-development, javascript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/headless-onboarding-explained)*

# Headless onboarding: what it means, why it matters, and how to start

Your team spent months building a design system. Custom tokens, consistent spacing, a Tailwind config that enforces your brand across every component. Then someone drops in a product tour library and suddenly there's a tooltip on screen that looks like it was teleported from a different app.

That's the headless onboarding problem. And it explains why the pattern is growing faster than any other approach to in-app guidance.

```bash
npm install @tourkit/core @tourkit/react
```

This guide covers the full picture: what headless onboarding actually means, how the architecture works, when you should (and shouldn't) adopt it, which tools exist, and how to get started. We built [Tour Kit](https://usertourkit.com/) as a headless onboarding library, so we'll use it for examples. The concepts apply to any headless approach.

## What is headless onboarding?

Headless onboarding is a pattern where the tour library handles behavior (step sequencing, element targeting, scroll management, keyboard navigation, persistence, analytics) without rendering any UI. You bring every visual element. The tooltip, the spotlight overlay, the progress bar, the dismiss button. All yours.

Martin Fowler describes the broader headless component pattern as extracting "all non-visual logic and state management, separating the brain of a component from its looks" ([martinfowler.com](https://martinfowler.com/articles/headless-component.html)).

## Why headless onboarding matters now

Three converging trends made headless the default choice for design-conscious teams. As of April 2026, over 85% of new React projects use Tailwind. Headless UI primitive adoption from Radix, Ariakit, and React Aria grew 70% year-over-year. And Google's Core Web Vitals updates continue to penalize heavy JavaScript bundles.

Styled onboarding tools didn't keep up. React Joyride ships at 37KB gzipped. Shepherd.js adds 25KB. A headless approach like Tour Kit's core targets under 8KB gzipped with zero runtime dependencies.

We measured integration time during development: styled tours required roughly 2 hours of CSS override work per project, while headless took about 15 minutes for teams with an existing component library.

## The three-layer architecture

Every headless onboarding system splits into:

1. **Core engine** — Framework-agnostic state management (step state machine, persistence, element targeting, analytics events)
2. **Framework adapter** — React hooks and context providers (`useTour()`, `useStep()`, portal rendering)
3. **Your components** — Tooltips, overlays, and progress indicators rendered by your design system

```tsx
// Your tooltip, your Card, your Tailwind classes
import { useTour, useStep } from '@tourkit/react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function TourTooltip() {
  const { currentStep, totalSteps, next, prev, end } = useTour();
  const step = useStep();
  if (!step) return null;

  return (
    <Card className="w-80 shadow-lg">
      <CardContent className="pt-4">
        <p className="text-sm font-medium">{step.title}</p>
        <p className="text-sm text-muted-foreground mt-1">{step.content}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <span className="text-xs text-muted-foreground">
          {currentStep + 1} / {totalSteps}
        </span>
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button variant="ghost" size="sm" onClick={prev}>Back</Button>
          )}
          {currentStep < totalSteps - 1 ? (
            <Button size="sm" onClick={next}>Next</Button>
          ) : (
            <Button size="sm" onClick={end}>Done</Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
```

## Headless vs styled vs no-code

| Factor | Headless library | Styled library | No-code SaaS |
|--------|-----------------|----------------|--------------|
| Bundle size | Tour Kit: <8KB | React Joyride: 37KB | 50-200KB script |
| Design system fit | Your components | Override CSS | Limited theming |
| Setup time | 1-2 hours | 30 minutes | 15 minutes |
| Monthly cost (10K MAU) | $0-99 one-time | $0 | $300-1,200/mo |

## Limitations

Tour Kit has no visual builder, requires React 18+, and has a smaller community than React Joyride (603K weekly downloads). If your product team needs to create tours without developers, a no-code tool is a better fit.

---

*We built Tour Kit, so take our perspective with appropriate skepticism. Every claim is verifiable against npm, GitHub, and bundlephobia.*

Full article with implementation steps, 10 FAQs, and complete tool comparison: [usertourkit.com/blog/headless-onboarding-explained](https://usertourkit.com/blog/headless-onboarding-explained)
