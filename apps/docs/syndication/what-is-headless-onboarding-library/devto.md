---
title: "What is a headless onboarding library? (and when you actually need one)"
published: false
description: "Headless onboarding libraries handle tour logic without rendering UI. Here's what that means in practice, how they compare to styled alternatives, and a decision framework for choosing."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/what-is-headless-onboarding-library
cover_image: https://usertourkit.com/og-images/what-is-headless-onboarding-library.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-headless-onboarding-library)*

# What is a headless onboarding library?

Your design system uses Tailwind. Your components sit in a shadcn/ui-based kit. Then the product team asks for an onboarding tour, and suddenly you're fighting CSS specificity wars against a library that ships its own tooltip styles, its own colors, its own overlay.

That's the problem headless onboarding libraries solve.

```bash
npm install @tourkit/core @tourkit/react
```

This article defines what a headless onboarding library actually is, explains how it differs from styled alternatives, and gives you a decision framework for picking the right approach. We built [Tour Kit](https://usertourkit.com/) as a headless onboarding library, so we'll use it for code examples. The pattern applies regardless of which tool you pick.

## Short answer

A headless onboarding library is a package that manages the state, step sequencing, persistence, and branching logic of product tours and onboarding flows without rendering any UI. You supply every visual element (tooltips, spotlights, modals, progress indicators) using your own components and design system. Tour Kit, OnboardJS, and partially Shepherd.js follow this pattern. As of April 2026, no styled product tour library ships under 15KB gzipped, while headless alternatives like Tour Kit's core package target under 8KB.

## How headless onboarding works

The idea comes from a broader React pattern. Juntao QIU describes it on Martin Fowler's site as "a component responsible solely for logic and state management without prescribing any specific UI" ([martinfowler.com](https://martinfowler.com/articles/headless-component.html)). Radix UI, React Aria, and Headless UI all implement this pattern for general components. Headless onboarding libraries apply the same principle to a specific domain: multi-step user flows.

In practice, a headless onboarding library exposes hooks and context providers. No `<div>`. No CSS file. No hardcoded tooltip.

```tsx
// src/components/OnboardingTour.tsx
import { TourProvider, useTour } from '@tourkit/react';

const steps = [
  { id: 'welcome', target: '#dashboard-header', title: 'Welcome' },
  { id: 'sidebar', target: '#nav-sidebar', title: 'Navigation' },
  { id: 'create', target: '#create-button', title: 'Create your first project' },
];

function TourTooltip() {
  const { currentStep, next, back, isLastStep } = useTour();
  if (!currentStep) return null;

  // Your component, your styles, your design system
  return (
    <div className="rounded-lg border bg-popover p-4 shadow-md">
      <p className="text-sm font-medium">{currentStep.title}</p>
      <div className="mt-3 flex gap-2">
        <button onClick={back} className="text-sm text-muted-foreground">Back</button>
        <button onClick={next} className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground">
          {isLastStep ? 'Done' : 'Next'}
        </button>
      </div>
    </div>
  );
}
```

The library handles which step is active, what element to highlight, keyboard navigation, focus management, and ARIA attributes. You handle how it looks.

OnboardJS describes this split clearly: the library manages "the flow logic, state management, data persistence, and navigation, completely separate from your user interface" ([onboardjs.com](https://onboardjs.com/blog/what-is-onboardjs)).

## Headless vs styled comparison: the real trade-offs

Not every team needs headless. Styled libraries like React Joyride and Reactour work fine when you don't have a design system or need something running in an afternoon. The trade-offs are concrete.

| Dimension | Headless (Tour Kit, OnboardJS) | Styled (React Joyride, Reactour) |
|---|---|---|
| Bundle size (gzipped) | <8KB core | 15-37KB including styles |
| Setup time | 30-60 min (you write the tooltip) | 5-15 min (renders out of the box) |
| Design system fit | Native (uses your components) | Requires CSS overrides |
| Accessibility | Built-in ARIA, focus trap, keyboard nav | Varies, often incomplete |
| CSS conflicts | None (no styles shipped) | Common with Tailwind, CSS Modules |
| Tree-shaking | Effective (no style side effects) | Limited (CSS imports prevent full shaking) |
| Theming | Inherits your theme automatically | Needs separate theme configuration |
| React 19 support | Tour Kit: native | React Joyride: partial |

Ashan Fernando at Bits and Pieces puts it simply: headless libraries "provide the essential functionality of UI components without imposing a specific design or styling, offering a blank canvas for designers and developers" ([blog.bitsrc.io](https://blog.bitsrc.io/headless-ui-libraries-for-react-top-5-e146145249fc)).

The bundle size gap matters more than it looks. React Joyride ships at roughly 37KB gzipped. On a mobile connection, that's an extra 200-400ms of parse time during the exact moment first impressions form: onboarding.

## The accessibility argument

Headless libraries have a structural advantage for accessibility. The library controls behavior (focus management, keyboard navigation, ARIA attributes) while you control rendering. That separation means the accessibility layer can't be accidentally overridden by style customizations.

Nir Ben-Yair documented this exact problem after building custom components on top of a styled library: "My hand-made components were simply not accessible enough for keyboard users and people who use screen readers" ([medium.com](https://medium.com/@nirbenyair/headless-components-in-react-and-why-i-stopped-using-ui-libraries-a8208197c268)). Switching to headless primitives solved both the styling and accessibility problems simultaneously.

For onboarding specifically, accessibility requirements are strict. A product tour creates modal-like overlays that must trap focus, announce step changes to screen readers via ARIA live regions, and support Escape to dismiss. Headless libraries bake these behaviors into the hook layer. You can't accidentally break them by changing a CSS class.

Tour Kit targets WCAG 2.1 AA compliance and scores Lighthouse Accessibility 100. One caveat: Tour Kit requires React 18+ and has no visual builder. If your team doesn't write React, a styled library or a no-code tool is probably the right call.

## When to choose headless

Use this decision framework:

**Choose headless if:**
- You have a design system (Tailwind, shadcn/ui, custom) and need onboarding to match it
- Bundle size budgets are tight (under 15KB for the tour layer)
- Your app already uses headless primitives (Radix, React Aria, Headless UI)
- You need WCAG 2.1 AA compliance without auditing a third-party component's CSS
- You want to own the rendering with no vendor lock-in on visual output

**Choose styled if:**
- You need a tour running in 15 minutes for a hackathon or prototype
- Design consistency isn't a requirement (internal tools, admin panels)
- Your team doesn't have React component experience
- You're evaluating product-market fit and will replace the tool later anyway

**Choose a no-code SaaS tool (Appcues, Userpilot) if:**
- Product managers need to create tours without developer involvement
- You're willing to pay $300+/month and accept the external script injection
- Bundle size and Core Web Vitals aren't constraints

There's an honest middle ground too. Shepherd.js ships with built-in styles but lets you override them fairly deeply. It sits between fully headless and fully styled.

## Headless onboarding libraries in 2026

As of April 2026, three libraries occupy the headless onboarding space:

**Tour Kit** is a 10-package React monorepo. Core logic, hints, checklists, analytics, announcements, surveys, and scheduling are separate packages. Install only what you need. MIT license for core packages, Pro license ($99 one-time) for extended packages. We built Tour Kit, so take this with appropriate skepticism.

**OnboardJS** takes a framework-agnostic approach. Pure JavaScript engine, framework adapters on top. Good fit if you're running Vue alongside React.

**Shepherd.js** is the veteran with over 170 releases and 100+ contributors as of March 2026. Not purely headless (it ships default styles), but configurable enough to function as near-headless. Watch the license: AGPL requires open-sourcing your application unless you buy a commercial license.

The styled incumbents aren't going away. React Joyride alone pulls 603K+ weekly npm downloads. But the direction is clear. Teams with design systems are moving toward headless, and one design systems report found 70% adoption growth for headless UI approaches in 2025.

```bash
npm install @tourkit/core @tourkit/react
```

Get started with [Tour Kit's documentation](https://usertourkit.com/docs) or browse the [GitHub repo](https://github.com/usertourkit/tour-kit).

## FAQ

### What is the difference between headless and styled onboarding libraries?

A headless onboarding library provides tour logic (step sequencing, persistence, keyboard navigation, ARIA attributes) without rendering any HTML or CSS. You supply your own components. A styled library renders pre-built UI that you customize through props or CSS overrides. Tour Kit is headless; React Joyride is styled.

### Can I use a headless onboarding library with shadcn/ui?

Yes. Headless onboarding libraries are designed for this exact use case. Because the library renders nothing, you build your tour tooltip using shadcn/ui's Popover, Card, or Dialog primitives. Tour Kit was built specifically to work with shadcn/ui and Tailwind CSS. Your tour inherits your design tokens automatically.

### Is a headless onboarding library harder to set up?

Initial setup takes longer. A styled library shows a working tour in 5 minutes; a headless library takes 20-60 minutes because you write the tooltip yourself. But you never fight CSS overrides afterward, and your tour matches your design system from day one.

### Are headless onboarding libraries better for accessibility?

Headless libraries have a structural advantage. They manage focus trapping, keyboard navigation, and ARIA attributes at the hook level, so CSS changes can't break them. Styled libraries sometimes let visual customizations accidentally interfere with accessibility markup. Tour Kit targets WCAG 2.1 AA and Lighthouse Accessibility 100.

### What is the smallest headless onboarding library?

Tour Kit's `@tourkit/core` package targets under 8KB gzipped with zero runtime dependencies. OnboardJS is similarly lightweight. By comparison, React Joyride ships at roughly 37KB gzipped, over 4x larger. Headless libraries achieve smaller bundles because they ship no CSS, no theme tokens, and no pre-built components.
