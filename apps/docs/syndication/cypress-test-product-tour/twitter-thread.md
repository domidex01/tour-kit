## Thread (6 tweets)

**1/** Product tours break in ways unit tests can't catch. Focus escaping overlays, completion callbacks firing twice in strict mode, tooltips missing because an element lazy-loaded 200ms late. Here's how to test them with Cypress 🧵

**2/** The fix: 6 custom commands that turn a 40-line tour test into 12 lines.

cy.startTour()
cy.goToNextStep()
cy.assertStepVisible(1)

Each command does one thing. Full suite runs in under 4 seconds.

**3/** Tour testing is different from standard E2E testing:

- Tooltips render in React portals (query at document root)
- Backdrop overlays sit at z-index 9999 (click inside tooltip)
- State persists in localStorage (clear in beforeEach or get false positives)

**4/** For accessibility: two layers.

cypress-axe runs 90+ WCAG rules in ~200ms per scan. But it can't check if focus escapes the overlay.

For that you need cy.realPress('Tab') and assert where focus actually lands. 96.3% of home pages have WCAG failures.

**5/** The bug nobody talks about: onComplete firing on skip.

This inflates your completion rates by 15-30% in production dashboards. One cy.stub() assertion catches it:

cy.get('@trackEvent').should('not.have.been.calledWith', 'tour_completed')

**6/** Full guide with all 6 steps, comparison table, troubleshooting, and Cypress vs Playwright comparison:

https://usertourkit.com/blog/cypress-test-product-tour
