# What is headless UI? A guide for onboarding engineers

## Why your product tour looks like it belongs to a different app — and how to fix it

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-headless-ui-guide-onboarding)*

You have a design system. Your product tour library ships its own tooltips, its own colors, its own overlay. Now your onboarding flow looks like it belongs to a different app.

That's the headless UI problem.

### The pattern

A headless UI component handles behavior and state without rendering any visual output. It provides the logic (event handling, keyboard navigation, focus management, ARIA attributes) and leaves the HTML and CSS entirely to the developer.

Martin Fowler describes it as extracting "all non-visual logic and state management, separating the brain of a component from its looks."

Think of it as the difference between buying furniture and buying a blueprint. A styled component library gives you a finished chair. It works, but reupholstering it means fighting the original fabric. A headless library gives you the joints, screws, and ergonomic measurements. You bring your own wood.

### Why this matters for onboarding

Product tour tools sit at a unique intersection of design and functionality. A tooltip that doesn't match your brand erodes trust during the exact moment you're trying to build it: first-run onboarding.

Traditional tools like Intro.js, Shepherd.js, and React Joyride bundle pre-styled UI. That made sense in 2018. But as of April 2026, headless component adoption grew 70% year-over-year. Product tour libraries didn't keep up.

### The evolution

The headless pattern evolved through three phases in React:

**Higher-order components (2015-2018)** — Wrapped components to inject props. Created "wrapper hell."

**Render props (2018-2019)** — Better than HOCs, but verbose. Downshift popularized this for comboboxes.

**Custom hooks (2019-present)** — Clean separation. A `useTour()` hook returns state and handlers. No wrappers, no render functions.

### The design system test

Simple heuristic: if your app has a design system, you need a headless tour library.

Design systems exist to enforce visual consistency. A styled tour library that injects its own visual language breaks that consistency when a new user is forming their first impression of your product.

This also matters for AI-assisted development. Tools like v0 and Cursor generate React + Tailwind + shadcn/ui code. A headless tour library slots into that output naturally because there are no style conflicts.

### Common mistakes

**Choosing headless when you don't have a design system.** If you're prototyping, a styled library gets you to a working tour faster.

**Rebuilding accessibility from scratch.** The point of a headless library is that it handles behavior including accessibility. Use the hook's built-in support.

**Over-abstracting the tour UI.** Write a concrete component for each tour context. Three simple components beat one complex one.

### Key takeaways

- A headless UI component separates behavior from rendering
- The pattern evolved from HOCs to render props to hooks
- If your app has a design system, headless onboarding tools avoid CSS specificity fights
- Accessibility comes free with a good headless library

Full article with comparison tables, code examples, and library recommendations: [usertourkit.com/blog/what-is-headless-ui-guide-onboarding](https://usertourkit.com/blog/what-is-headless-ui-guide-onboarding)

*Submit to: JavaScript in Plain English, Better Programming, Bits and Pieces*
