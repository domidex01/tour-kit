## Title: Unit testing React product tour components with Vitest

## URL: https://usertourkit.com/blog/unit-testing-tour-kit-components-vitest

## Comment to post immediately after:

Product tour components sit at an awkward intersection: they need nested context providers, DOM measurement for positioning, keyboard navigation for accessibility, and storage for persistence. Most teams skip testing them.

This is a walkthrough of the patterns we use: a `renderWithProviders` utility that wraps in real providers (not mocked context), vitest-axe for automated WCAG checks (catches ~57% of issues), and storage adapter isolation tests.

The jsdom limitation is the interesting part — `getBoundingClientRect()` returns zeroes, so any position-dependent logic needs either vi.spyOn mocks or Vitest's browser mode. We show both approaches.

Built on Tour Kit (our headless React tour library), but the testing patterns apply to any context-heavy React component.
