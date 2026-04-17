# How to test React product tour components (the patterns nobody writes about)

*Originally published at [usertourkit.com](https://usertourkit.com/blog/unit-testing-tour-kit-components-vitest)*

Product tour components are some of the hardest UI to test well. They sit at the intersection of context providers, DOM positioning, keyboard navigation, and ARIA accessibility attributes. Most teams skip testing them entirely and rely on manual QA.

That's a mistake. A tour that works in Chrome on your machine can break under screen readers, fail on keyboard-only navigation, or silently lose progress when localStorage fills up.

This tutorial walks through testing product tour components with Vitest and React Testing Library. Vitest cold-starts in about 200ms (vs Jest's 2-4 seconds), and its watch mode re-runs a single file change in 380ms. That speed loop matters when you're writing behavioral tests.

## The key insight: don't mock context

The biggest testing mistake with tour components is mocking React context. The React Testing Library docs say it directly: wrap in real providers with controlled values.

Build a `renderWithProviders` utility that takes a tour definition and wraps the component under test. Use Tour Kit's `createTour()` and `createStep()` factories for type-safe defaults.

## What to test (and what to skip)

**Test these:**
- Hook state transitions (useTour next/prev/close)
- Component content rendering (does the right step show?)
- Keyboard navigation (Escape closes, Tab cycles focus)
- ARIA attributes (dialog role, labelledby, live regions)
- Storage adapters (serialization, prefix isolation)

**Skip these in jsdom:**
- Position calculations (jsdom returns 0,0 for getBoundingClientRect)
- Visual overlay rendering
- Scroll-into-view behavior

For the position-dependent stuff, use Vitest Browser Mode or Playwright component testing.

## Accessibility testing with vitest-axe

The `vitest-axe` package wraps axe-core for automated WCAG checks. As of April 2026, axe-core catches up to 57% of accessibility issues automatically. Not comprehensive, but a failing check always means something is broken.

Combine automated axe scans with explicit assertions: check for `role="dialog"`, verify `aria-labelledby` is set, confirm Escape key dismisses the tour, and test that Tab cycles focus within the tour card.

## The full tutorial

The complete walkthrough with all code examples, troubleshooting for common errors (act warnings, provider-not-found, position mocking), and FAQ is here:

**[Unit testing Tour Kit components with Vitest](https://usertourkit.com/blog/unit-testing-tour-kit-components-vitest)**

It covers 6 steps: install, provider wrapper, hook tests, component tests, accessibility tests, and storage adapter tests. Every code example is runnable TypeScript.
