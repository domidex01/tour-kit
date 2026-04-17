---
title: "What is headless UI? The architecture pattern explained"
published: false
description: "A headless UI component handles behavior without rendering HTML or CSS. Here's how the pattern works, why it matters for accessibility, and how the major React libraries compare."
tags: react, javascript, webdev, beginners
canonical_url: https://usertourkit.com/blog/what-is-headless-ui
cover_image: https://usertourkit.com/og-images/what-is-headless-ui.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-headless-ui)*

# What is headless UI? The architecture pattern explained

You install a component library, wire up a dropdown, and immediately start fighting it. The border radius doesn't match your design system. The focus ring color is wrong. The animation timing clashes with your app's feel.

This is the problem headless UI solves.

## Definition

A headless UI component provides behavior and state without rendering any HTML or CSS. It handles the logic (keyboard navigation, focus management, ARIA attributes, open/close state) and leaves every visual decision to you. Juntao QIU describes the pattern as "extracting all non-visual logic and state management, separating the brain of a component from its looks" ([martinfowler.com](https://martinfowler.com/articles/headless-component.html)).

Think of it as buying an engine without the car body. You get the mechanical parts that are hard to build correctly (accessibility, state machines, edge cases), then design the exterior yourself.

## How the headless component pattern works

Headless components separate concerns into two layers: a logic layer that manages state and behavior, and a rendering layer that you control entirely. In React, the logic layer is typically a custom hook that returns props and state. Your JSX does the rest.

Three implementation approaches exist in the wild:

**Custom hooks** return state and event handlers. You spread them onto your own elements.

```tsx
// src/components/Dropdown.tsx
import { useDropdown } from './use-dropdown';

function Dropdown() {
  const { isOpen, triggerProps, menuProps, itemProps } = useDropdown();

  return (
    <div>
      <button {...triggerProps}>Options</button>
      {isOpen && (
        <ul {...menuProps}>
          <li {...itemProps('edit')}>Edit</li>
          <li {...itemProps('delete')}>Delete</li>
        </ul>
      )}
    </div>
  );
}
```

**Compound components** use React context to share state across a group of related elements — Radix UI popularized this approach. And **render props** pass state through a function child, though hooks replaced this pattern after React 16.8.

Where did this come from? Classical GUI architectures, specifically Martin Fowler's Presentation Model from 2004 and MVVM in WPF/Silverlight. Same core idea: separate the brain from the body. React hooks just made it practical for the web.

## Headless UI examples and libraries

As of April 2026, six major headless React libraries cover different use cases. Radix UI leads with 9.1 million weekly npm downloads and 28 components. React Aria from Adobe ships 40+ hooks with the deepest WCAG compliance. Headless UI from Tailwind Labs keeps things minimal at 10 components and around 12KB gzipped ([bundlephobia](https://bundlephobia.com/package/@headlessui/react)).

| Library | Framework | Components | Approach |
|---------|-----------|------------|----------|
| Radix UI | React | 28 | Compound components |
| Headless UI (Tailwind Labs) | React, Vue | 10 | Compound components |
| React Aria (Adobe) | React | 40+ | Hooks |
| Ariakit | React | 25+ | Compound + hooks |
| Base UI (MUI) | React | 20+ | Hooks + components |
| Tour Kit | React | 10 packages | Hooks + compound |

Radix was released in December 2020 and quickly became the dominant headless library ([Subframe, 2024](https://www.subframe.com/blog/how-headless-components-became-the-future-for-building-ui-libraries)). shadcn/ui pushed the pattern further: copy component source directly into your repo. Style it however you want. That's the logical endpoint of headless. If logic and style are fully decoupled, why ship a package at all?

## Why headless UI matters

Headless architecture solves three problems at once: design consistency, accessibility compliance, and bundle weight. As of 2026, 73% of businesses use some form of headless architecture, and 98% of the rest plan to evaluate it within 12 months.

Accessibility is the strongest argument. Building a dropdown with correct keyboard navigation, screen reader announcements, focus trapping, and ARIA roles across browsers? Months of dedicated work ([Smashing Magazine](https://www.smashingmagazine.com/2022/09/accessibility-times-headless/)). Headless libraries ship that behavior pre-tested. You don't need to become an accessibility expert to ship WCAG 2.1 AA compliant components.

An engineer at Gloat described spending six months migrating from React-Bootstrap to Material-UI, then refactoring the same component to a headless approach in "a couple of hours" ([Nir Ben-Yair, Medium](https://medium.com/@nirbenyair/headless-components-in-react-and-why-i-stopped-using-ui-libraries-a8208197c268)). Six months versus two hours. The time difference comes from not fighting styling overrides.

Headless components also tree-shake well. Import only the primitives you need, so your bundle doesn't carry 40 components when you use 3.

But there's a tradeoff: you write more JSX. No `<Button variant="primary" />` that renders a finished component. You own every class name, every wrapper div. For teams without a design system, that slows things down initially.

## Headless UI in Tour Kit

[Tour Kit](https://usertourkit.com/docs) applies the headless pattern to product tours and onboarding. The `@tour-kit/core` package provides hooks like `useTour()` and `useStep()` that manage tour state, step progression, and highlight positioning. The `@tour-kit/react` package adds thin component wrappers, but you can bypass them entirely and render steps with your own UI.

```tsx
// src/components/TourStep.tsx
import { useStep } from '@tourkit/react';

function CustomTooltip() {
  const { content, currentStep, totalSteps, next, prev } = useStep();

  return (
    <div className="rounded-lg border bg-white p-4 shadow-lg">
      <p>{content}</p>
      <div className="mt-3 flex justify-between text-sm">
        <button onClick={prev}>Back</button>
        <span>{currentStep} / {totalSteps}</span>
        <button onClick={next}>Next</button>
      </div>
    </div>
  );
}
```

Your product tour matches your design system exactly. No CSS overrides, no `!important` hacks. Tour Kit's core ships under 8KB gzipped with zero runtime dependencies. Worth noting the limitation: it requires React 18+ and doesn't have a visual builder, so you need developers to set up tours.

For a deeper walkthrough of headless architecture applied to onboarding, see the [guide for onboarding engineers](https://usertourkit.com/blog/what-is-headless-ui-guide-onboarding).

Get started with [Tour Kit on GitHub](https://github.com/domidex/tour-kit) or install it now:

```bash
npm install @tourkit/core @tourkit/react
```

Full documentation at [usertourkit.com](https://usertourkit.com/).

## FAQ

### What is the difference between headless UI and a headless CMS?

Different uses of "headless." A headless CMS separates content storage from frontend rendering (Contentful, Sanity). A headless UI component separates interaction logic from visual rendering. Both decouple concerns at different layers of the stack. When React developers say "headless UI," they mean the component pattern.

### Is headless UI harder to use than styled component libraries?

Headless UI requires more initial setup since you write markup and styles yourself. But long-term maintenance is easier. No hours spent overriding default styles or fighting opinions baked into the library. Teams with a design system or Tailwind typically find headless faster after the first component.

### Which headless UI library should I pick for React?

Radix UI has the largest ecosystem and powers shadcn/ui. React Aria from Adobe has the most thorough accessibility coverage. Headless UI from Tailwind Labs is the smallest option. For product tours specifically, Tour Kit provides headless tour primitives. Pick based on your component needs and accessibility requirements.

### Can I use headless UI with Tailwind CSS?

Yes, and it's one of the most common pairings. shadcn/ui proved the model: Radix headless primitives styled with Tailwind utility classes, copied directly into your project. Tour Kit follows a similar philosophy, giving you unstyled hooks and components that you style with Tailwind or any CSS approach.
