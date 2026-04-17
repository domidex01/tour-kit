Product tours look simple until you try to test them.

Tooltips render in React portals outside the component tree. Backdrop overlays intercept clicks at z-index 9999. Focus escapes into background content. And completion callbacks fire twice in React strict mode.

None of these bugs show up in unit tests. They only surface in a real browser with real DOM timing.

I wrote a complete guide on testing product tours with Cypress. The approach:

→ 6 reusable custom commands that cut a 40-line test to 12 lines
→ cypress-axe for automated WCAG 2.1 AA scanning (90+ rules, 200ms per check)
→ cy.stub() for verifying analytics callbacks fire exactly once
→ Focus trap assertions with cypress-real-events

One finding that surprised me: the most common product tour bug is onComplete firing on skip/dismiss, inflating completion rates by 15-30% in production dashboards. A single assertion catches it.

Full guide with code examples and troubleshooting: https://usertourkit.com/blog/cypress-test-product-tour

#react #cypress #testing #accessibility #webdevelopment #opensource
