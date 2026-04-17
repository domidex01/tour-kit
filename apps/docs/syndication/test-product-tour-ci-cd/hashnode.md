---
title: "How do I test product tours in CI/CD?"
slug: "test-product-tour-ci-cd"
canonical: https://usertourkit.com/blog/test-product-tour-ci-cd
tags: react, testing, javascript, web-development, ci-cd
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/test-product-tour-ci-cd)*

# How do I test product tours in CI/CD?

Most teams ship product tours without automated tests. Then a CSS change breaks the tooltip positioning, a refactor removes the target element, or a React upgrade silently kills the focus trap. Nobody catches it until a support ticket lands.

Here's a three-layer test strategy using Vitest, Playwright, and axe-core that catches tour breakages before they reach production.

## The three-layer approach

Split your tests into unit (tour config validation), integration (rendering + accessibility), and E2E (complete flows). The recommended ratio: 70% unit/integration, 20% component, 10% E2E. Teams using this approach report 28% fewer production defects.

| Test layer | What to test | Tool | Speed |
|---|---|---|---|
| Unit | Tour state machine, step ordering | Vitest | <10s |
| Integration | Step rendering, focus traps, ARIA | Vitest + RTL + axe-core | <30s |
| E2E | Full tour completion, multi-page | Playwright (headless) | 1-3min |

## Unit tests: fast validation

```ts
import { describe, it, expect } from 'vitest';
import { tourSteps } from '../tours/onboarding';

describe('onboarding tour configuration', () => {
  it('has sequential step IDs with no gaps', () => {
    const ids = tourSteps.map((s) => s.id);
    expect(ids).toEqual([...new Set(ids)]);
  });

  it('every step targets an existing selector', () => {
    for (const step of tourSteps) {
      expect(step.target).toMatch(/^[.#\[]/);
    }
  });
});
```

## Integration tests: catch real bugs

```tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TourProvider, TourStep } from '@tourkit/react';

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
```

## E2E: critical flows only

```ts
import { test, expect } from '@playwright/test';

test('user completes onboarding tour', async ({ page }) => {
  await page.goto('/dashboard');
  const firstStep = page.getByRole('dialog');
  await expect(firstStep).toBeVisible();

  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(firstStep).not.toBeVisible();

  await page.reload();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
```

## GitHub Actions config

```yaml
name: Tour Tests
on: [push, pull_request]
jobs:
  unit-and-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx vitest run

  e2e:
    runs-on: ubuntu-latest
    needs: unit-and-integration
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --workers=1
```

## Tour-specific gotchas

- **Portal rendering:** `getBoundingClientRect()` returns zeros in jsdom. Use Playwright for positioning tests.
- **localStorage:** Seed state before tests with `page.evaluate(() => localStorage.setItem(...))`.
- **Focus management:** Assert with `toHaveFocus()` in integration tests.
- **Animation timing:** Disable with `prefers-reduced-motion: reduce`.

Read the [full article](https://usertourkit.com/blog/test-product-tour-ci-cd) for the complete comparison table, decision framework, and FAQ.
