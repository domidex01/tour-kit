# What is headless UI? The architecture pattern that changed how we build React components

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-headless-ui)*

**The pattern that separates logic from rendering — and why 73% of businesses now use it.**

You install a component library, wire up a dropdown, and immediately start fighting it. The border radius doesn't match your design system. The focus ring color is wrong. The animation timing clashes with your app's feel.

This is the problem headless UI solves.

## Definition

A headless UI component provides behavior and state without rendering any HTML or CSS. It handles the logic — keyboard navigation, focus management, ARIA attributes, open/close state — and leaves every visual decision to you. Juntao QIU describes the pattern as "extracting all non-visual logic and state management, separating the brain of a component from its looks" (martinfowler.com).

Think of it as buying an engine without the car body. You get the mechanical parts that are hard to build correctly, then design the exterior yourself.

## How it works

Headless components split into two layers: a logic layer that manages state and behavior, and a rendering layer that you control entirely. In React, the logic layer is a custom hook. Your JSX does the rest.

Custom hooks return state and event handlers. You spread them onto your own elements. Compound components use React context to share state across related elements. And render props pass state through a function child, though hooks replaced this pattern after React 16.8.

Where did this come from? Classical GUI architectures. Martin Fowler's Presentation Model from 2004. MVVM in WPF/Silverlight. Same core idea: separate the brain from the body. React hooks just made it practical for the web.

## The major libraries

As of April 2026, six major headless React libraries cover different use cases:

- Radix UI: 9.1 million weekly npm downloads, 28 components, compound component approach
- Headless UI (Tailwind Labs): React and Vue, 10 components, around 12KB gzipped
- React Aria (Adobe): 40+ hooks, deepest WCAG compliance
- Ariakit: 25+ components, lightweight and composable
- Base UI (MUI): 20+ components, familiar API for MUI users
- Tour Kit: 10 packages, headless product tours and onboarding

Radix was released in December 2020 and quickly became the dominant headless library. shadcn/ui pushed the pattern further: copy component source directly into your repo. Style it however you want. That's the logical endpoint of headless. If logic and style are fully decoupled, why ship a package at all?

## Why it matters

Accessibility is the strongest argument. Building a dropdown with correct keyboard navigation, screen reader announcements, focus trapping, and ARIA roles across browsers takes months of dedicated work. Headless libraries ship that behavior pre-tested.

An engineer at Gloat described spending six months migrating from React-Bootstrap to Material-UI, then refactoring the same component to a headless approach in "a couple of hours." Six months versus two hours. The time difference comes from not fighting styling overrides.

Headless components also tree-shake well. Import only the primitives you need.

But there's a tradeoff: you write more JSX. You own every class name, every wrapper div. For teams without a design system, that slows things down initially.

## Headless for product tours

Tour Kit applies the headless pattern to product tours and onboarding. The core package provides hooks like useTour() and useStep() that manage tour state, step progression, and highlight positioning. You render steps with your own components.

Your product tour matches your design system exactly. Tour Kit's core ships under 8KB gzipped with zero runtime dependencies. It requires React 18+ and doesn't have a visual builder, so you need developers to set up tours.

Full article with code examples and comparison table: https://usertourkit.com/blog/what-is-headless-ui

---

*Suggested Medium publications: JavaScript in Plain English, Bits and Pieces, Better Programming*
*Import via medium.com/p/import to set canonical URL automatically*
