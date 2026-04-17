## Subreddit: r/reactjs (primary), r/cypress (secondary)

**Title:** I wrote a guide on testing product tours with Cypress — custom commands, focus trapping, and a11y checks

**Body:**

I've been working on a product tour library for React, and one of the things I kept running into was that unit tests miss most tour-related bugs. Tooltips rendering in portals, focus escaping the overlay, completion callbacks firing twice in strict mode — all of that needs a real browser.

So I wrote up the approach I landed on for Cypress E2E testing. The core idea is six custom commands (`startTour()`, `goToNextStep()`, `assertStepVisible(n)`, etc.) that make a 7-step tour test about 12 lines instead of 40+. The full suite runs in under 4 seconds locally.

The part I found most useful was combining cypress-axe for automated WCAG scanning (90+ rules, about 200ms per check) with manual focus trap assertions using cypress-real-events. Axe catches missing ARIA labels but can't tell you if focus escapes the tooltip — that needs `cy.realPress('Tab')` and checking where focus actually lands.

One gotcha that cost me hours: if you don't clear localStorage in `beforeEach`, your tour tests get false positives because the tour was already dismissed from a prior run.

Full article with all the code, a troubleshooting section, and Cypress vs Playwright comparison: https://usertourkit.com/blog/cypress-test-product-tour

Happy to answer any questions about the approach.
