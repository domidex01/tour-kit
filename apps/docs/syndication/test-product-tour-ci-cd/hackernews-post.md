## Title: Testing product tours in CI/CD: a three-layer strategy with Vitest, Playwright, and axe-core

## URL: https://usertourkit.com/blog/test-product-tour-ci-cd

## Comment to post immediately after:

Product tours have four testing challenges that generic component tests don't face: portal rendering breaks getBoundingClientRect() in jsdom (always returns 0), localStorage state leaks between test runs, focus management breaks silently (critical for accessibility), and CSS animations cause timing-dependent failures.

We built Tour Kit (a headless React product tour library) and landed on a three-layer test strategy:

1. Unit tests with Vitest for tour config validation (<1s)
2. Integration tests with React Testing Library + axe-core for rendering and WCAG compliance (<30s)
3. Playwright E2E for critical complete-flow tests only (1-3 min)

The ratio is roughly 70/20/10. Our full suite across 10 packages completes in under 90 seconds on GitHub Actions. The key insight was that integration tests catch ~80% of real tour bugs — things like broken focus traps, missing ARIA labels, keyboard navigation failures. E2E is expensive and should only cover multi-page flows and persistence verification.

One practical tip: set `--workers=1` in CI for Playwright (per their own docs). And don't cache browser binaries — restoration time roughly equals download time, so you gain nothing.
