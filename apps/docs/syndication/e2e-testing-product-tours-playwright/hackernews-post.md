## Title: E2E Testing Product Tours with Playwright – Tooltips, Focus Traps, ARIA, Z-Index

## URL: https://usertourkit.com/blog/e2e-testing-product-tours-playwright

## Comment to post immediately after:

I wrote this because I kept hitting the same bugs in product tours (overlays, focus traps, animation timing) and couldn't find any existing content on testing them properly with Playwright.

The short version: product tours touch almost every fragile UI behavior — z-index stacking, CSS animations, focus management, ARIA attributes — but nobody writes E2E tests for them. When a tour breaks, it fails silently. No error in your tracker. The tooltip just doesn't appear, or it renders behind a modal, or it traps focus with no escape key handler.

The 8-test suite covers rendering (boundingBox checks), step navigation, keyboard accessibility (Escape, Tab, ArrowRight), ARIA roles, animation timing (using getAnimations() instead of waitForTimeout), and z-index conflicts. Runs in 3.2 seconds on CI.

Two techniques worth calling out: (1) The Web Animations API lets you wait for CSS transitions without hardcoded timeouts. (2) Comparing computed z-index values between your overlay and fixed elements catches visual regressions that functional tests miss.

Written with Tour Kit (a headless React tour library I'm building), but the Playwright patterns apply to any overlay/tooltip testing.
