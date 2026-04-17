# How Do I Test Product Tours in CI/CD?

## A three-layer strategy with Vitest, Playwright, and axe-core

*Originally published at [usertourkit.com](https://usertourkit.com/blog/test-product-tour-ci-cd)*

Most teams ship product tours without automated tests. Then a CSS change breaks the tooltip positioning, a refactor removes the target element, or a React upgrade silently kills the focus trap. Nobody catches it until a support ticket lands.

Testing product tours in CI/CD pipelines prevents these regressions. But tours aren't typical UI components. They span multiple pages, manipulate focus, render overlays via portals, and persist state across sessions. Standard component tests miss most failure modes.

## The Testing Trophy applied to product tours

Kent C. Dodds' Testing Trophy model recommends investing most effort in integration tests. Product tours amplify this: tooltips, overlays, and focus traps interact with the real DOM in ways unit tests can't verify, and E2E tests are too slow to cover every step permutation.

The recommended ratio: 70% unit/integration, 20% component, 10% E2E. Teams using this layered approach report 28% fewer production defects and 32% fewer flaky UI incidents.

## Layer 1: Unit tests for tour config

Unit tests validate tour definitions, step ordering, and state transitions without a browser. They run in under a second and catch silent breakages like removed selectors or circular dependencies.

Test your tour hook state transitions: Does currentStep update on advance? Does isActive flip on dismissal? Pure logic, zero flakiness.

## Layer 2: Integration tests for rendering and accessibility

This is where you catch the bugs that reach users. Mount tour components in jsdom and verify rendering, focus management, and WCAG compliance in a single pass.

Pair with axe-core to surface accessibility regressions invisible in screenshots but critical for screen reader users: missing ARIA labels on close buttons, insufficient color contrast on overlays, focus not returning to the trigger element after dismissal.

## Layer 3: E2E tests for complete flows

E2E tests spin up a real browser and interact with tours the way a user would. Reserve them for critical paths only: onboarding completion, multi-page flows, and the "tour doesn't restart after reload" check.

Playwright's auto-waiting handles the timing issues that plague tour testing. No sleep(500) after clicking Next. The toBeVisible() assertion polls until the element appears.

## Tour-specific gotchas in CI

Four challenges generic component tests don't face:

**Portal rendering.** getBoundingClientRect() returns zeros in jsdom. Use Playwright for positioning tests.

**localStorage persistence.** Seed state before tests that check "don't show the tour after completion."

**Focus management.** Assert with toHaveFocus() in integration tests. These transitions are invisible in screenshots.

**Animation timing.** Disable CSS transitions with prefers-reduced-motion: reduce or use Playwright's auto-waiting.

## What we recommend

Tour Kit's headless architecture makes testing simpler than styled alternatives. Because it doesn't ship its own CSS, you're testing your components and your styles. No fighting library-internal DOM structures.

Our full test suite runs in under 90 seconds on GitHub Actions across all 10 packages. That said, Tour Kit is React 18+ only and requires developers comfortable writing tests and tour JSX.

Read the [full article with code examples and GitHub Actions config](https://usertourkit.com/blog/test-product-tour-ci-cd).

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
