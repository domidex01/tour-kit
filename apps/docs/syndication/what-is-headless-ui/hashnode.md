---
title: "What is headless UI? The architecture pattern explained"
slug: "what-is-headless-ui"
canonical: https://usertourkit.com/blog/what-is-headless-ui
tags: react, javascript, web-development, accessibility
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

As of April 2026, six major headless React libraries cover different use cases. Radix UI leads with 9.1 million weekly npm downloads and 28 components. React Aria from Adobe ships 40+ hooks with the deepest WCAG compliance.

| Library | Framework | Components | Approach |
|---------|-----------|------------|----------|
| Radix UI | React | 28 | Compound components |
| Headless UI (Tailwind Labs) | React, Vue | 10 | Compound components |
| React Aria (Adobe) | React | 40+ | Hooks |
| Ariakit | React | 25+ | Compound + hooks |
| Base UI (MUI) | React | 20+ | Hooks + components |
| Tour Kit | React | 10 packages | Hooks + compound |

## Why headless UI matters

Headless architecture solves three problems at once: design consistency, accessibility compliance, and bundle weight. As of 2026, 73% of businesses use some form of headless architecture.

Accessibility is the strongest argument. Building a dropdown with correct keyboard navigation, screen reader announcements, focus trapping, and ARIA roles across browsers? Months of dedicated work ([Smashing Magazine](https://www.smashingmagazine.com/2022/09/accessibility-times-headless/)). Headless libraries ship that behavior pre-tested.

An engineer at Gloat described spending six months migrating from React-Bootstrap to Material-UI, then refactoring the same component to a headless approach in "a couple of hours" ([Nir Ben-Yair, Medium](https://medium.com/@nirbenyair/headless-components-in-react-and-why-i-stopped-using-ui-libraries-a8208197c268)). Six months versus two hours.

But there's a tradeoff: you write more JSX. No `<Button variant="primary" />` that renders a finished component. You own every class name, every wrapper div.

## Headless UI in Tour Kit

[Tour Kit](https://usertourkit.com/docs) applies the headless pattern to product tours and onboarding. The `@tour-kit/core` package provides hooks like `useTour()` and `useStep()` that manage tour state, step progression, and highlight positioning.

```tsx
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

Tour Kit's core ships under 8KB gzipped with zero runtime dependencies. It requires React 18+ and doesn't have a visual builder, so you need developers to set up tours.

Full documentation at [usertourkit.com](https://usertourkit.com/).
