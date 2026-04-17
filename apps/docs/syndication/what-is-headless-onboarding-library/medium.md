# What is a headless onboarding library?

## The pattern that lets your product tours match your design system

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-headless-onboarding-library)*

Your design system uses Tailwind. Your components sit in a shadcn/ui-based kit. Then the product team asks for an onboarding tour, and suddenly you're fighting CSS specificity wars against a library that ships its own tooltip styles, its own colors, its own overlay.

That's the problem headless onboarding libraries solve.

A headless onboarding library manages the state, step sequencing, persistence, and branching logic of product tours without rendering any UI. You supply every visual element using your own components and design system.

The idea comes from a broader React pattern. Juntao QIU describes it on Martin Fowler's site as "a component responsible solely for logic and state management without prescribing any specific UI." Radix UI, React Aria, and Headless UI all implement this pattern for general components. Headless onboarding libraries apply the same principle to multi-step user flows.

In practice, a headless onboarding library exposes hooks and context providers. No rendered div. No CSS file. No hardcoded tooltip. The library handles which step is active, what element to highlight, keyboard navigation, focus management, and ARIA attributes. You handle how it looks.

## The real trade-offs

Not every team needs headless. Styled libraries like React Joyride and Reactour work fine when you don't have a design system or need something running in an afternoon.

The key differences: headless libraries ship under 8KB gzipped (vs 15-37KB for styled), fit natively into design systems, and have built-in accessibility. Styled libraries are faster to set up (5-15 minutes vs 30-60 minutes) and work out of the box.

The bundle size gap matters more than it looks. React Joyride ships at roughly 37KB gzipped. On a mobile connection, that's an extra 200-400ms of parse time during the exact moment first impressions form: onboarding.

## The accessibility argument

Headless libraries have a structural advantage for accessibility. The library controls behavior (focus management, keyboard navigation, ARIA attributes) while you control rendering. That separation means the accessibility layer can't be accidentally overridden by style customizations.

As developer Nir Ben-Yair documented: "My hand-made components were simply not accessible enough for keyboard users and people who use screen readers." Switching to headless primitives solved both the styling and accessibility problems simultaneously.

## When to choose headless

Choose headless if you have a design system and need onboarding to match it, if bundle size budgets are tight, or if your app already uses headless primitives like Radix or React Aria.

Choose styled if you need a tour running in 15 minutes for a hackathon, design consistency isn't a requirement, or you're evaluating product-market fit and will replace the tool later.

Choose a no-code SaaS tool (Appcues, Userpilot) if product managers need to create tours without developer involvement and you're willing to pay $300+/month.

## The landscape in 2026

Tour Kit is a 10-package React monorepo with MIT core and $99 one-time Pro license. OnboardJS takes a framework-agnostic approach with a pure JavaScript engine. Shepherd.js is the veteran with 170+ releases, though its AGPL license requires open-sourcing your application unless you buy commercial.

The styled incumbents aren't going away. React Joyride alone pulls 603K+ weekly npm downloads. But the direction is clear. Teams with design systems are moving toward headless, with 70% adoption growth for headless UI approaches in 2025.

Full article with code examples and comparison table: [usertourkit.com/blog/what-is-headless-onboarding-library](https://usertourkit.com/blog/what-is-headless-onboarding-library)

---

*Suggest submitting to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium.*
