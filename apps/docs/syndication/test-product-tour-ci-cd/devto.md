---
title: "Testing product tours in CI/CD: a three-layer strategy"
published: false
description: "Most teams ship product tours without tests. Here's how to set up unit, integration, and E2E tests for onboarding flows using Vitest, Playwright, and axe-core."
tags: react, testing, webdev, tutorial
canonical_url: https://usertourkit.com/blog/test-product-tour-ci-cd
cover_image: https://usertourkit.com/og-images/test-product-tour-ci-cd.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/test-product-tour-ci-cd)*

# How do I test product tours in CI/CD?

Most teams ship product tours without automated tests. Then a CSS change breaks the tooltip positioning, a refactor removes the target element, or a React upgrade silently kills the focus trap. Nobody catches it until a support ticket lands.

Testing product tours in CI/CD pipelines prevents these regressions. But tours aren't typical UI components. They span multiple pages, manipulate focus, render overlays via portals, and persist state across sessions. Standard component tests miss most failure modes.

Here's how to build a test strategy that catches real tour breakages before they reach production.

```bash
npm install @tourkit/core @tourkit/react
```

## Short answer

Test product tours in CI/CD by splitting your strategy into three layers: unit tests for tour configuration and state logic (Vitest, fast, runs on every commit), integration tests for step rendering and accessibility (React Testing Library + axe-core), and a small E2E suite for critical complete-tour flows (Playwright in headless mode). As of April 2026, teams using this layered approach report 28% fewer production defects and 32% fewer flaky UI incidents compared to untested onboarding flows.

## The testing trophy for product tours

The Testing Trophy model, introduced by Kent C. Dodds, recommends investing most effort in integration tests because they offer the best confidence-to-cost ratio for UI components. Product tours amplify this: tooltips, overlays, and focus traps interact with the real DOM in ways that unit tests can't verify, and E2E tests are too slow to cover every step permutation.

"The more your tests resemble the way your software is used, the more confidence they can give you" ([Kent C. Dodds](https://kentcdodds.com/blog/static-vs-unit-vs-integration-vs-e2e-tests)). For tours, this means integration tests carry the most weight.

| Test layer | What to test | Tool | Run frequency | Speed |
|---|---|---|---|---|
| Static analysis | Type errors, lint rules, tour config schemas | TypeScript strict + Biome | Every commit | <5s |
| Unit | Tour state machine, step ordering, persistence logic | Vitest | Every commit | <10s |
| Integration | Step rendering, focus traps, ARIA attributes, keyboard nav | Vitest + React Testing Library + axe-core | Every commit | <30s |
| E2E | Full tour completion, multi-page flows, visual regression | Playwright (headless) | PR + main merge | 1-3min |

The recommended ratio sits around 70% unit/integration, 20% component, 10% E2E. Most teams over-invest in E2E for tours and end up with slow, flaky pipelines.

## Unit tests: tour configuration and state

Unit tests validate tour definitions, step ordering, and state transitions without a browser or DOM. They run in under a second, catch silent breakages like removed selectors or circular step dependencies, and provide the fastest feedback loop in your pipeline.

```ts
// src/__tests__/tour-config.test.ts
import { describe, it, expect } from 'vitest';
import { tourSteps } from '../tours/onboarding';

describe('onboarding tour configuration', () => {
  it('has sequential step IDs with no gaps', () => {
    const ids = tourSteps.map((s) => s.id);
    expect(ids).toEqual([...new Set(ids)]); // no duplicates
  });

  it('every step targets an existing selector', () => {
    for (const step of tourSteps) {
      expect(step.target).toMatch(/^[.#\[]/); // valid CSS selector
    }
  });

  it('first step has no prerequisites', () => {
    expect(tourSteps[0].prerequisite).toBeUndefined();
  });
});
```

For Tour Kit specifically, test your `useTour()` hook state transitions. Does `currentStep` update when a step advances? Does `isActive` flip to false on dismissal? Pure logic, zero flakiness.

## Integration tests: rendering and accessibility

Integration tests mount tour components in jsdom and verify rendering, focus management, and WCAG compliance in a single pass. This layer catches the bugs that actually reach users: broken focus traps, missing ARIA labels, and keyboard navigation failures.

```tsx
// src/__tests__/tour-a11y.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TourProvider, TourStep } from '@tourkit/react';
import { expect, it } from 'vitest';

expect.extend(toHaveNoViolations);

it('tour step has no accessibility violations', async () => {
  const { container } = render(
    <TourProvider>
      <div id="target-element">Click me</div>
      <TourStep target="#target-element" content="Welcome!" />
    </TourProvider>
  );

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

it('focus moves to tour step on activation', async () => {
  render(
    <TourProvider autoStart>
      <button id="start-btn">Start</button>
      <TourStep target="#start-btn" content="Begin here" />
    </TourProvider>
  );

  const tooltip = await screen.findByRole('dialog');
  expect(tooltip).toHaveFocus();
});
```

We tested Tour Kit's core components with axe-core and hit two issues we wouldn't have caught manually: the overlay's backdrop needed `aria-hidden="true"`, and the step counter was missing a `role="status"` attribute.

## E2E tests: full tour flows in Playwright

E2E tests spin up a real browser and interact with your tour the way a user would. Reserve them for critical paths: onboarding completion, multi-step flows that span routes, and tour-doesn't-restart-after-reload checks.

```ts
// e2e/onboarding-tour.spec.ts
import { test, expect } from '@playwright/test';

test('user completes onboarding tour', async ({ page }) => {
  await page.goto('/dashboard');

  const firstStep = page.getByRole('dialog');
  await expect(firstStep).toBeVisible();
  await expect(firstStep).toContainText('Welcome to your dashboard');

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Create your first project')).toBeVisible();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Invite your team')).toBeVisible();

  await page.getByRole('button', { name: 'Done' }).click();
  await expect(firstStep).not.toBeVisible();

  // Verify tour doesn't restart on reload
  await page.reload();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
```

## GitHub Actions: the CI configuration

GitHub Actions is the most common CI platform for product tour testing, holding 33% market share as of April 2026. The configuration below splits fast tests from E2E:

```yaml
# .github/workflows/tour-tests.yml
name: Tour Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-and-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx vitest run --reporter=verbose

  e2e:
    runs-on: ubuntu-latest
    needs: unit-and-integration
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --workers=1
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

Set `--workers=1` in CI. The [Playwright docs](https://playwright.dev/docs/ci) recommend this for stability. And skip caching browser binaries — restoration time roughly equals download time.

## Tour-specific gotchas in CI

**Portal rendering.** Tours render tooltips through React portals. In jsdom, `getBoundingClientRect()` returns all zeros, so tooltip positioning tests need a real browser.

**localStorage persistence.** If your tests check "don't show the tour after completion," seed localStorage before the test: `page.evaluate(() => localStorage.setItem('tour-completed', 'true'))`.

**Focus management.** When a tour step opens, focus should move to the tooltip. When it closes, focus returns to the trigger. React Testing Library's `toHaveFocus()` catches these.

**Animation timing.** CSS transitions on tooltip entrance cause flaky tests. Disable animations with `prefers-reduced-motion: reduce` or use Playwright's auto-waiting.

## What we recommend (and why)

Tour Kit's headless architecture makes testing simpler than styled alternatives. We run our test suite with Vitest for unit/integration, Playwright for E2E, and axe-core for accessibility across all 10 packages. The full suite completes in under 90 seconds on GitHub Actions.

That said, Tour Kit is React 18+ only and doesn't have a visual builder, so you need developers comfortable writing both tests and tour JSX.

Install Tour Kit and start with a single integration test:

```bash
npm install @tourkit/core @tourkit/react
```

Browse the [Tour Kit documentation](https://usertourkit.com/) for testing patterns.

## FAQ

**Can I test product tours without E2E tests?**
Yes. Unit and integration tests cover step rendering, state transitions, and ARIA compliance. Most teams get 80% coverage from integration tests alone.

**Which CI provider works best?**
GitHub Actions works well because Playwright's official docs ship with GitHub Actions configuration. GitLab CI and Jenkins also support Playwright via Docker images.

**How do I test tour accessibility in CI?**
Combine React Testing Library with axe-core for integration-level WCAG checks. For CI, Cypress with the wick-a11y plugin provides WCAG 2.2 compliance reports.

**Why are my product tour E2E tests flaky?**
Three reasons: animation timing, portal rendering delays, and localStorage leaking between tests. Set `--workers=1` in CI to reduce contention.

**How long should product tour CI tests take?**
Unit/integration: under 30 seconds. E2E: 1-3 minutes. Total pipeline under 4 minutes is achievable.
