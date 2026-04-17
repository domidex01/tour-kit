---
title: "Headless onboarding explained: what it is, why it matters, and how to start"
published: false
description: "Your design system is Tailwind + shadcn/ui. Your product tour library ships its own tooltips. Headless onboarding fixes this by separating tour logic from UI rendering. Here's the full breakdown with code and architecture patterns."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/headless-onboarding-explained
cover_image: https://usertourkit.com/og-images/headless-onboarding-explained.png
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

Headless onboarding is a pattern where the tour library handles behavior (step sequencing, element targeting, scroll management, keyboard navigation, persistence, analytics) without rendering any UI. You bring every visual element. The tooltip, the spotlight overlay, the progress bar, the dismiss button. All yours. The library provides the logic through hooks and context providers, and you wire it into your existing component system.

Martin Fowler describes the broader headless component pattern as extracting "all non-visual logic and state management, separating the brain of a component from its looks" ([martinfowler.com](https://martinfowler.com/articles/headless-component.html)). Applied to onboarding, this means your product tours look identical to the rest of your app because they're rendered by the same components.

The term covers more than just product tours. Headless onboarding encompasses tours, checklists, feature announcements, hint beacons, NPS surveys, and adoption nudges, all built on the same separation principle.

## Why headless onboarding matters now

Three converging trends made headless the default choice for teams that care about design consistency. As of April 2026, over 85% of new React projects use a utility-first CSS framework like Tailwind ([State of CSS 2025](https://stateofcss.com/)). The adoption of headless UI primitives from Radix, Ariakit, and React Aria grew 70% year-over-year, driven by shadcn/ui hitting 80,000+ GitHub stars ([Bitsrc](https://blog.bitsrc.io/headless-ui-libraries-for-react-top-5-e146145249fc)). And Google's Core Web Vitals updates continue to penalize heavy JavaScript bundles, with pages loading over 45KB of JS seeing 23% higher bounce rates on mobile ([web.dev](https://web.dev/vitals/)).

Styled onboarding tools didn't keep up. React Joyride ships at 37KB gzipped. Shepherd.js adds 25KB. Intro.js lands at 12KB but brings its own CSS that fights your design tokens. A headless approach like Tour Kit's core package targets under 8KB gzipped with zero runtime dependencies.

But bundle size is just one reason. The bigger one is developer experience.

When your team runs shadcn/ui with Radix primitives and Tailwind, a styled tour library creates friction at every touch point. Override CSS selectors to match your border radius. Fight z-index battles between the tour overlay and your existing modals. Write wrapper components that strip the library's styles and replace them with your own.

At that point you've spent more time fighting the library than using it. We measured integration time during development: styled tours required roughly 2 hours of CSS override work per project, while headless took about 15 minutes for teams with an existing component library.

## How headless onboarding architecture works

Every headless onboarding system splits into three layers: a framework-agnostic core engine, a framework adapter (React, Vue, etc.), and your UI components that handle all rendering.

### Layer 1: the core engine

Framework-agnostic state management. No React, no DOM manipulation, no rendering. Pure TypeScript that handles:

- Step state machine (current step, previous, next, skip, complete)
- Element targeting by CSS selector or ref
- Position calculation (top, bottom, left, right, auto)
- Persistence adapters (localStorage, sessionStorage, server)
- Event emission for analytics
- Audience targeting and conditional logic

### Layer 2: the framework adapter

React (or Vue, or Svelte) bindings that connect the core engine to framework-specific patterns. In React, this means:

- Context providers that distribute tour state
- Custom hooks like `useTour()`, `useStep()`, `useTourHighlight()`
- Portal rendering for overlays (using `createPortal`)
- Integration with React's lifecycle (effects, refs, concurrent features)

```tsx
// src/providers/TourProvider.tsx
import { TourProvider, TourKitProvider } from '@tourkit/react';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TourKitProvider>
      <TourProvider
        tourId="onboarding"
        steps={[
          { target: '#dashboard-nav', title: 'Navigation' },
          { target: '#create-button', title: 'Create your first project' },
          { target: '#settings-gear', title: 'Customize your workspace' },
        ]}
      >
        {children}
      </TourProvider>
    </TourKitProvider>
  );
}
```

### Layer 3: your components

This is where headless pays off. You render every visual element using your own design system. A tooltip is your `<Card>` with your `<Button>`. A spotlight is your overlay component.

```tsx
// src/components/TourTooltip.tsx
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
        <p className="text-sm text-muted-foreground mt-1">
          {step.content}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <span className="text-xs text-muted-foreground">
          {currentStep + 1} / {totalSteps}
        </span>
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button variant="ghost" size="sm" onClick={prev}>
              Back
            </Button>
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

That tooltip uses your `Card`, your `Button`, your Tailwind classes. It looks like it belongs in your app because it does.

## Headless vs styled vs no-code: when to use each

| Factor | Headless library | Styled library | No-code SaaS tool |
|--------|-----------------|----------------|-------------------|
| Design system fit | Your components, your tokens | Override CSS to match | Limited theming controls |
| Bundle size (gzipped) | Tour Kit core: <8KB | React Joyride: 37KB, Shepherd.js: 25KB | 50-200KB external script |
| Setup time | 1-2 hours (with component library) | 30 minutes (out of the box) | 15 minutes (point and click) |
| Customization ceiling | Unlimited (you control rendering) | Limited by library's API | Limited by vendor's builder |
| Monthly cost (10K MAU) | $0 (MIT) or $99 one-time (Pro) | $0 (open source) | $300-1,200/month |

**Choose headless when** your team has a component library (shadcn/ui, custom Radix, MUI), cares about bundle size, and wants full control over look and feel.

**Choose styled when** you need something working in under an hour and don't mind the visual mismatch.

**Choose no-code when** non-technical product managers need to create and edit tours without developer involvement.

## How to implement headless onboarding (step by step)

### Step 1: install the packages

```bash
npm install @tourkit/core @tourkit/react
```

### Step 2: wrap your app with providers

```tsx
// src/app/layout.tsx (Next.js App Router)
import { TourKitProvider } from '@tourkit/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TourKitProvider>{children}</TourKitProvider>
      </body>
    </html>
  );
}
```

### Step 3: define your tour steps

```tsx
// src/tours/onboarding.ts
import type { TourStep } from '@tourkit/core';

export const onboardingSteps: TourStep[] = [
  {
    target: '#sidebar-nav',
    title: 'Navigate your workspace',
    content: 'Use the sidebar to switch between projects, settings, and team views.',
  },
  {
    target: '[data-tour="create-project"]',
    title: 'Create your first project',
    content: 'Click here to set up a new project. It takes about 30 seconds.',
  },
  {
    target: '#invite-button',
    title: 'Invite your team',
    content: 'Add teammates by email. They will get access immediately.',
  },
];
```

### Step 4: render with your own components

Use the hooks to connect tour state to your UI. The `TourTooltip` component shown earlier is a complete example.

### Step 5: trigger the tour

```tsx
// src/components/OnboardingTrigger.tsx
import { useTour } from '@tourkit/react';

export function OnboardingTrigger() {
  const { start, isActive } = useTour();

  if (isActive) return null;

  return (
    <button onClick={() => start()} className="text-sm text-blue-600">
      Take a tour
    </button>
  );
}
```

## Limitations of headless onboarding

Headless isn't a silver bullet. Honest assessment of the tradeoffs:

**You need React developers.** Tour Kit and other headless libraries require writing JSX. If your product team wants to create tours without engineering involvement, a no-code tool like Appcues or Userpilot is a better fit. Tour Kit has no visual builder.

**Initial setup takes longer.** A styled library gives you a working tour in 30 minutes. Headless requires building your tooltip, overlay, and progress components first.

**Smaller community.** React Joyride has 603K weekly downloads and years of Stack Overflow answers. Tour Kit is a younger project.

**React 18+ only.** Tour Kit doesn't support older React versions.

---

*We built Tour Kit, so take our perspective with appropriate skepticism. Every claim in this guide is verifiable against [npm](https://www.npmjs.com/), [GitHub](https://github.com/), and [bundlephobia](https://bundlephobia.com/).*

Full article with all 10 FAQ answers, complete tool comparison, and internal links: [usertourkit.com/blog/headless-onboarding-explained](https://usertourkit.com/blog/headless-onboarding-explained)
