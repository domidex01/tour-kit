## Title: Testing Product Tours with Cypress – Custom Commands, A11y Checks, and Analytics Verification

## URL: https://usertourkit.com/blog/cypress-test-product-tour

## Comment to post immediately after:

I built a headless product tour library for React and kept hitting bugs that unit tests couldn't catch — tooltips in React portals, focus escaping overlay backdrops, completion callbacks firing twice in strict mode. All timing-and-DOM issues that only surface in a real browser.

This guide covers the Cypress E2E approach I landed on: six reusable custom commands for tour interactions, cypress-axe for automated WCAG 2.1 AA scanning (90+ rules in ~200ms per check), and cy.stub() for verifying analytics callbacks fire exactly once.

The most interesting finding: the most common product tour bug is onComplete firing on skip/dismiss, inflating completion rates by 15-30% in production dashboards. A simple cy.stub() assertion catches this cleanly.

The article also covers why tour testing is different from standard E2E testing (portals, z-index overlays, localStorage state persistence, focus trapping) and includes a troubleshooting section for CI flakiness.
