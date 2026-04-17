Product tours are one of the most fragile UI patterns in web apps — and almost nobody writes automated tests for them.

I just published a tutorial on E2E testing product tours with Playwright. The core insight: tours touch every category of UI behavior that breaks silently in production. Z-index stacking, animation timing, focus management, ARIA attributes.

When a tour breaks, there's no error in your tracker. The tooltip just doesn't appear, or it renders behind a modal, or it traps keyboard focus with no escape. According to Pendo's 2025 report, apps with working onboarding flows see 2.5x higher 7-day retention.

The 8-test suite runs in 3.2 seconds on CI and covers the patterns that catch 90% of tour bugs:
→ Viewport bounds checking with boundingBox()
→ Web Animations API instead of hardcoded timeouts
→ WCAG keyboard navigation and focus restoration
→ Z-index comparison against fixed elements

Full tutorial with TypeScript code: https://usertourkit.com/blog/e2e-testing-product-tours-playwright

#react #playwright #testing #accessibility #webdevelopment #frontend
