Product tours are one of the most-skipped areas of automated testing. Until a CSS change breaks your onboarding tooltip and nobody catches it for weeks.

I wrote a guide on testing product tours in CI/CD pipelines. The approach:

Unit tests for tour config validation (<1s). Integration tests with axe-core for accessibility compliance (<30s). Playwright E2E for critical flows only (1-3 min).

The key insight: integration tests catch ~80% of real tour bugs. Focus traps, ARIA labels, keyboard navigation. E2E is too expensive to cover every step permutation.

Teams using this layered approach report 28% fewer production defects and 32% fewer flaky UI incidents.

Full guide with code examples and GitHub Actions workflow: https://usertourkit.com/blog/test-product-tour-ci-cd

#react #testing #cicd #accessibility #webdevelopment #devops #opensource
