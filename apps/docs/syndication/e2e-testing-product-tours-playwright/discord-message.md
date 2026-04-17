## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote a tutorial on E2E testing product tours with Playwright — the thing nobody tests but probably should. Covers tooltip rendering, keyboard/ARIA accessibility, animation timing (using getAnimations() instead of waitForTimeout), and z-index conflicts. 8 tests, 3.2s on CI.

https://usertourkit.com/blog/e2e-testing-product-tours-playwright

Curious if anyone has patterns for testing other overlay-heavy UI (modals with portals, dropdown menus, etc) — the z-index and focus trap testing felt like it could generalize.
