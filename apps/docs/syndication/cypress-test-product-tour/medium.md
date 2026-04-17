# Testing Product Tours with Cypress: A Complete Guide

*How to write reliable E2E tests for multi-step onboarding flows*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/cypress-test-product-tour)*

Product tours break in ways that unit tests can't catch. A tooltip anchored to an element that lazy-loads 200ms late. A "Next" button that loses focus when the backdrop overlay re-renders. A tour that fires its completion callback twice because React strict mode double-mounts the component.

These bugs only surface when real browser rendering meets real DOM timing — exactly what Cypress was built for.

I wrote a complete tutorial covering how to write Cypress E2E tests for product tour flows. Here's the approach:

## 6 custom commands for any tour

Instead of scattering `cy.get()` calls across test files, you create six reusable commands: `startTour()`, `assertStepVisible(n)`, `goToNextStep()`, `goToPreviousStep()`, `skipTour()`, and `completeTour()`. A 7-step tour test drops from 40+ lines to about 12.

## Tour-specific testing patterns

Product tours need patterns that standard E2E strategies don't cover:

- **Tooltips render in React portals** — query at document root, not within the component tree
- **Backdrop overlays at z-index 9999** — click within the tooltip, not behind the overlay
- **Step transitions take 300ms** — increase `defaultCommandTimeout` to 6000ms
- **State persists in localStorage** — clear it in `beforeEach` or get false positives
- **Focus trapping** — use `cypress-real-events` to test real Tab key behavior

## Accessibility: two-layer coverage

The `cypress-axe` plugin runs 90+ WCAG 2.1 AA checks in about 200ms per scan. But it only catches structural issues like missing ARIA labels. You also need manual keyboard assertions to verify focus trapping (WCAG 2.4.3) and keyboard navigation (WCAG 2.1.1).

According to the WebAIM Million report, 96.3% of home pages have detectable WCAG failures. Focus management is one of the top 5 categories.

## The analytics callback bug nobody talks about

The most common product tour bug: `onComplete` fires on skip, inflating completion rates by 15–30% in production dashboards. Cypress's `cy.stub()` catches this cleanly:

```
cy.skipTour();
// Verify dismissal tracked, completion NOT tracked
cy.get('@trackEvent').should('have.been.calledWith', 'tour_dismissed', ...);
cy.get('@trackEvent').should('not.have.been.calledWith', 'tour_completed');
```

The full tutorial includes all 6 steps with complete code examples, a troubleshooting section for CI flakiness, and an FAQ covering Cypress vs Playwright for tour testing.

Read the full guide: [usertourkit.com/blog/cypress-test-product-tour](https://usertourkit.com/blog/cypress-test-product-tour)

---

*Suggested publications: JavaScript in Plain English, Better Programming, ITNEXT*
*Import via: medium.com/p/import (sets canonical automatically)*
