---
title: "Testing product tours with Cypress: a complete guide"
slug: "cypress-test-product-tour"
canonical: https://usertourkit.com/blog/cypress-test-product-tour
tags: react, cypress, testing, accessibility, javascript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/cypress-test-product-tour)*

# Testing product tours with Cypress

Product tours break in ways that unit tests can't catch. A tooltip anchored to an element that lazy-loads 200ms late. A "Next" button that loses focus when the backdrop overlay re-renders. A tour that fires its completion callback twice because React strict mode mounts the component, unmounts it, then mounts it again. These bugs only surface when real browser rendering meets real DOM timing, which is exactly what Cypress was built for.

This tutorial walks through writing Cypress end-to-end tests for a product tour built with Tour Kit. You'll test step navigation, tooltip positioning, keyboard accessibility, and tour completion tracking. By the end, you'll have a reusable set of custom commands that work for any tour flow.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

A Cypress test suite covering five tour behaviors: step progression, keyboard navigation, skip/dismiss flows, accessibility compliance, and analytics callback verification. We tested this against a 7-step onboarding tour in a Vite + React 19 project, and the full suite runs in under 4 seconds locally.

## Tour testing vs standard E2E testing

| Tour testing concern | Standard approach | Tour-specific Cypress pattern |
|---|---|---|
| Tooltip in React portal | Query within component tree | `cy.get('[data-cy="tour-step-0"]')` at document root |
| Backdrop overlay (z-index 9999) | Click target directly | Click within the tooltip, not behind overlay |
| Step transition (300ms CSS) | Assert immediately | `defaultCommandTimeout: 6000` with retry |
| Persisted state (localStorage) | No cleanup needed | `cy.clearLocalStorage()` in beforeEach |
| Focus trapping | Not tested | `cy.realPress('Tab')` + focus assertion |
| Hover-triggered hints | `.trigger('mouseover')` | `cy.realHover()` via cypress-real-events |

## The 6 custom commands you need

```typescript
// cypress/support/commands.ts

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

Each command does one thing. `goToNextStep()` clicks "Next" and nothing else, because asserting which step appeared is the test's job.

## Keyboard + accessibility testing

Two layers of coverage: manual keyboard assertions and automated axe-core scanning.

```typescript
// Focus trapping
it('traps focus within the active tour step', () => {
  cy.get('[data-cy="tour-step-0"]').within(() => {
    cy.get('button, a, [tabindex]').first().focus();
    cy.get('button, a, [tabindex]').last().focus();
    cy.realPress('Tab');
    cy.get('button, a, [tabindex]').first().should('have.focus');
  });
});

// Automated a11y scanning
it('passes axe checks on each tour step', () => {
  cy.checkA11y('[data-cy="tour-step-0"]');
  cy.goToNextStep();
  cy.checkA11y('[data-cy="tour-step-1"]');
});
```

The `cypress-axe` plugin checks 90+ WCAG 2.1 AA rules in about 200ms per scan. But as Cypress docs note: "No automated scan can prove that the interface is fully accessible." Use axe as a safety net alongside the keyboard tests.

## Analytics callback verification

The most common bug: `onComplete` fires on skip, inflating completion rates by 15-30%.

```typescript
it('tracks tour dismissal separately from completion', () => {
  cy.skipTour();
  cy.get('@trackEvent')
    .should('have.been.calledWith', 'tour_dismissed', {
      tourId: 'onboarding',
      stepIndex: 0,
    });
  cy.get('@trackEvent').should('not.have.been.calledWith', 'tour_completed');
});
```

---

Full article with all 6 steps, troubleshooting, and FAQ: [usertourkit.com/blog/cypress-test-product-tour](https://usertourkit.com/blog/cypress-test-product-tour)
