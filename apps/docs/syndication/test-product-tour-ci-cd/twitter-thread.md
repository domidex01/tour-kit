## Thread (6 tweets)

**1/** Most teams ship product tours with zero automated tests. Then a CSS change breaks the tooltip, a refactor removes the target element, and nobody catches it until a support ticket arrives.

Here's how to fix that with a three-layer CI/CD strategy:

**2/** Layer 1: Unit tests (Vitest)

Validate tour config — step ordering, CSS selectors, no circular deps. Runs in <1 second. Catches the silent breakages.

The surprise: TypeScript strict mode catches half the issues before tests even run.

**3/** Layer 2: Integration tests (RTL + axe-core)

This is where you catch ~80% of real bugs. Mount tour components in jsdom, verify focus moves to the tooltip, check ARIA attributes.

We found 2 a11y issues in Tour Kit this way that were invisible in screenshots.

**4/** Layer 3: E2E (Playwright)

Only for critical paths. Onboarding completion, multi-page tours, "doesn't restart on reload."

Set --workers=1 in CI (Playwright's own recommendation). Don't cache browser binaries — restoration time ≈ download time.

**5/** Tour-specific gotchas:
- getBoundingClientRect() returns 0s in jsdom (use Playwright for positioning)
- localStorage leaks between tests (clear in beforeEach)
- CSS animations cause flakiness (disable with prefers-reduced-motion: reduce)

**6/** Full guide with working code examples, GitHub Actions workflow, and a Playwright vs Cypress comparison table:

https://usertourkit.com/blog/test-product-tour-ci-cd

Our full suite runs in under 90 seconds across 10 packages.
