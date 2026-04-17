---
title: "Testing Product Tours with Cypress: Custom Commands, A11y, and Analytics"
published: false
description: "Product tours break in ways unit tests can't catch. Here's how to write Cypress E2E tests for multi-step tour flows — with 6 reusable custom commands, cypress-axe accessibility checks, and analytics callback verification."
tags: react, cypress, testing, accessibility
canonical_url: https://usertourkit.com/blog/cypress-test-product-tour
cover_image: https://usertourkit.com/og-images/cypress-test-product-tour.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/cypress-test-product-tour)*

# Testing product tours with Cypress

Product tours break in ways that unit tests can't catch. A tooltip anchored to an element that lazy-loads 200ms late. A "Next" button that loses focus when the backdrop overlay re-renders. A tour that fires its completion callback twice because React strict mode mounts the component, unmounts it, then mounts it again. These bugs only surface when real browser rendering meets real DOM timing, which is exactly what Cypress was built for.

This tutorial walks through writing Cypress end-to-end tests for a product tour built with Tour Kit. You'll test step navigation, tooltip positioning, keyboard accessibility, and tour completion tracking. By the end, you'll have a reusable set of custom commands that work for any tour flow.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

A Cypress test suite that covers five critical tour behaviors: step progression, keyboard navigation, skip and dismiss flows, accessibility compliance, and analytics callback verification. The test suite uses custom commands so you can reuse the same patterns across every tour in your app. We tested this approach against a 7-step onboarding tour in a Vite + React 19 project, and the full suite runs in under 4 seconds locally.

## Prerequisites

- React 18+ or React 19 with a working Tour Kit tour (see the [getting started guide](https://usertourkit.com/docs/getting-started))
- Cypress 13+ installed (`npm install -D cypress`)
- Node 18+ (Cypress 13 dropped Node 16)
- Basic familiarity with Cypress `cy.get()` and `cy.click()`

## What makes tour testing different from standard E2E testing

Product tours use UI patterns that standard E2E test strategies don't account for. Tooltips render in React portals outside the component tree. Backdrop overlays intercept click events at z-index 9999+. Step transitions involve CSS animations that take 200-400ms to settle. And tour state persists in localStorage across page reloads, creating hidden dependencies between test runs.

| Tour testing concern | Standard E2E approach | Tour-specific Cypress pattern |
|---|---|---|
| Tooltip in React portal | Query within component tree | `cy.get('[data-cy="tour-step-0"]')` at document root |
| Backdrop overlay (z-index 9999) | Click target element directly | Click within the tooltip, not behind the overlay |
| Step transition (300ms CSS) | Assert immediately | `defaultCommandTimeout: 6000` with retry |
| Persisted state (localStorage) | No cleanup needed | `cy.clearLocalStorage('tour-kit-completed')` in beforeEach |
| Focus trapping | Not tested | `cy.realPress('Tab')` + focus assertion loop |
| ARIA live regions | Not tested | `cy.get('[aria-live="polite"]').should('contain.text')` |
| Hover-triggered hints | `.trigger('mouseover')` | `cy.realHover()` via cypress-real-events plugin |
| Multi-step progression | Separate test per page | Single test with sequential assertions |

## Step 1: set up Cypress for tour testing

Cypress needs specific configuration for tour testing because product tour components render differently from standard page elements.

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 6000,
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
```

The `defaultCommandTimeout` of 6 seconds matters. Tour Kit's default step transition takes 300ms, and if your app lazy-loads the target element, Cypress needs time to retry its queries. We hit flaky failures on CI runners with 2x CPU throttling until we bumped it.

Now add `data-cy` attributes to your tour components. Cypress's own docs are direct: "Don't target elements based on CSS attributes such as id, class, tag. Add `data-*` attributes to make it easier to target elements" ([Cypress Best Practices](https://docs.cypress.io/app/core-concepts/best-practices)).

```tsx
// src/components/ProductTour.tsx
import { TourProvider, TourStep } from '@tourkit/react';

const steps: TourStep[] = [
  {
    target: '[data-cy="dashboard-header"]',
    content: ({ stepIndex, totalSteps, goToNextStep }) => (
      <div data-cy={`tour-step-${stepIndex}`} role="dialog" aria-label={`Step ${stepIndex + 1} of ${totalSteps}`}>
        <p>Welcome to your dashboard</p>
        <button data-cy="tour-next" onClick={goToNextStep}>
          Next
        </button>
      </div>
    ),
  },
];
```

## Step 2: write custom commands for tour interactions

Cypress custom commands turn repetitive tour interactions into single-line calls, cutting a 7-step tour test from 40+ lines of `cy.get()` chains down to about 12 lines.

```typescript
// cypress/support/commands.ts

declare global {
  namespace Cypress {
    interface Chainable {
      startTour(): Chainable<void>;
      assertStepVisible(stepIndex: number): Chainable<JQuery<HTMLElement>>;
      goToNextStep(): Chainable<void>;
      goToPreviousStep(): Chainable<void>;
      skipTour(): Chainable<void>;
      completeTour(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('startTour', () => {
  cy.get('[data-cy="start-tour-button"]').click();
  cy.get('[data-cy="tour-step-0"]').should('be.visible');
});

Cypress.Commands.add('assertStepVisible', (stepIndex: number) => {
  cy.get(`[data-cy="tour-step-${stepIndex}"]`)
    .should('be.visible')
    .and('have.attr', 'role', 'dialog');
});

Cypress.Commands.add('goToNextStep', () => {
  cy.get('[data-cy="tour-next"]').should('be.visible').click();
});

Cypress.Commands.add('goToPreviousStep', () => {
  cy.get('[data-cy="tour-prev"]').should('be.visible').click();
});

Cypress.Commands.add('skipTour', () => {
  cy.get('[data-cy="tour-skip"]').click();
  cy.get('[data-cy^="tour-step-"]').should('not.exist');
});

Cypress.Commands.add('completeTour', () => {
  cy.get('[data-cy="tour-complete"]').click();
  cy.get('[data-cy^="tour-step-"]').should('not.exist');
});
```

## Step 3: test the full tour flow

```typescript
// cypress/e2e/onboarding-tour.cy.ts

describe('Onboarding tour', () => {
  beforeEach(() => {
    cy.clearLocalStorage('tour-kit-completed');
    cy.visit('/dashboard');
  });

  it('walks through all steps in order', () => {
    cy.startTour();
    cy.assertStepVisible(0);
    cy.contains('Welcome to your dashboard').should('be.visible');

    cy.goToNextStep();
    cy.assertStepVisible(1);

    cy.goToNextStep();
    cy.assertStepVisible(2);

    cy.goToNextStep();
    cy.assertStepVisible(3);
    cy.completeTour();
  });

  it('skips the tour and persists dismissal', () => {
    cy.startTour();
    cy.skipTour();
    cy.reload();
    cy.get('[data-cy^="tour-step-"]', { timeout: 2000 }).should('not.exist');
  });
});
```

## Step 4: test keyboard navigation and focus management

Keyboard accessibility is the number one failure mode for product tours. According to the WebAIM Million report, 96.3% of home pages have detectable WCAG failures, and focus management is one of the top 5 categories.

```typescript
// cypress/e2e/tour-keyboard.cy.ts

describe('Tour keyboard navigation', () => {
  beforeEach(() => {
    cy.clearLocalStorage('tour-kit-completed');
    cy.visit('/dashboard');
    cy.startTour();
  });

  it('traps focus within the active tour step', () => {
    cy.get('[data-cy="tour-step-0"]').within(() => {
      cy.get('button, a, [tabindex]').first().focus();
      cy.get('button, a, [tabindex]').last().focus();
      cy.realPress('Tab');
      cy.get('button, a, [tabindex]').first().should('have.focus');
    });
  });

  it('closes tour on Escape key', () => {
    cy.realPress('Escape');
    cy.get('[data-cy^="tour-step-"]').should('not.exist');
  });
});
```

The `cy.realPress()` calls come from the `cypress-real-events` plugin. Install with `npm install -D cypress-real-events`.

## Step 5: add accessibility checks with cypress-axe

The `cypress-axe` plugin runs Deque's axe-core engine, checking 90+ WCAG 2.1 AA rules in about 200ms per scan.

But as the Cypress docs flag: "No automated scan can prove that the interface is fully accessible" ([Cypress Accessibility Guide](https://docs.cypress.io/app/guides/accessibility-testing)). Use axe as a safety net, not a substitute for the keyboard tests in step 4.

```typescript
// cypress/e2e/tour-a11y.cy.ts
import 'cypress-axe';

describe('Tour accessibility', () => {
  beforeEach(() => {
    cy.clearLocalStorage('tour-kit-completed');
    cy.visit('/dashboard');
    cy.injectAxe();
    cy.startTour();
  });

  it('passes axe checks on each tour step', () => {
    cy.checkA11y('[data-cy="tour-step-0"]');
    cy.goToNextStep();
    cy.checkA11y('[data-cy="tour-step-1"]');
  });

  it('has correct ARIA roles on tour elements', () => {
    cy.get('[data-cy="tour-step-0"]')
      .should('have.attr', 'role', 'dialog')
      .and('have.attr', 'aria-label');
  });
});
```

## Step 6: test tour analytics callbacks

Tour Kit exposes `onStepChange`, `onComplete`, and `onDismiss` callbacks. The most common bug: `onComplete` fires on skip, inflating completion rates by 15-30% in production.

```typescript
describe('Tour analytics callbacks', () => {
  beforeEach(() => {
    cy.clearLocalStorage('tour-kit-completed');
    cy.visit('/dashboard');
    cy.window().then((win) => {
      cy.stub(win, 'trackEvent').as('trackEvent');
    });
    cy.startTour();
  });

  it('tracks tour dismissal separately from completion', () => {
    cy.skipTour();
    cy.get('@trackEvent')
      .should('have.been.calledWith', 'tour_dismissed', {
        tourId: 'onboarding',
        stepIndex: 0,
      });
    cy.get('@trackEvent').should('not.have.been.calledWith', 'tour_completed');
  });
});
```

---

Full article with all 6 steps, troubleshooting section, and FAQ: [usertourkit.com/blog/cypress-test-product-tour](https://usertourkit.com/blog/cypress-test-product-tour)
