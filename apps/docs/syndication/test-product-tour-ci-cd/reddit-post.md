## Subreddit: r/reactjs

**Title:** How we test product tours in CI/CD (unit, integration, and E2E strategy)

**Body:**

I've been working on a product tour library and spent a lot of time figuring out how to test tours reliably in CI. Turns out tours have testing challenges most UI components don't: portal rendering breaks getBoundingClientRect in jsdom, localStorage state leaks between test runs, focus management fails silently, and CSS animations cause timing-dependent flakiness.

We landed on a three-layer approach:

- **Unit tests (Vitest):** Validate tour configuration — step ordering, CSS selectors, no circular dependencies. Runs in <1 second, catches the silent stuff.
- **Integration tests (Vitest + React Testing Library + axe-core):** Mount tour components in jsdom, verify focus moves correctly, check ARIA attributes, run axe-core for WCAG compliance. This catches about 80% of real bugs.
- **E2E (Playwright):** Only for critical complete-flow tests — onboarding completion, multi-page tours, "tour doesn't restart on reload." We run with `--workers=1` in CI per Playwright's own recommendation.

The ratio that works for us: 70% unit/integration, 20% component, 10% E2E. Our full suite runs in under 90 seconds on GitHub Actions.

Some gotchas worth knowing: don't cache Playwright browser binaries in CI (restoration time ≈ download time), disable CSS animations with `prefers-reduced-motion: reduce` to kill flakiness, and use `page.evaluate(() => localStorage.setItem(...))` to seed tour state for persistence tests.

Full writeup with code examples and a GitHub Actions workflow: https://usertourkit.com/blog/test-product-tour-ci-cd

Curious how others handle testing tooltips and overlays in CI — especially the positioning side. What's worked for you?
