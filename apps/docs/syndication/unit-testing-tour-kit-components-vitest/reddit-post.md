## Subreddit: r/reactjs

**Title:** How we test product tour components with Vitest + RTL (provider wrappers, accessibility, storage adapters)

**Body:**

I've been working on testing patterns for product tour components and wanted to share what we landed on. Tours are surprisingly hard to test well — they need multiple nested context providers, keyboard navigation, ARIA compliance, and storage persistence.

The biggest lesson: don't mock React context. We built a `renderWithProviders()` utility that wraps components in real `TourProvider` and `TourKitProvider` instances with controlled values. This follows the RTL docs recommendation and catches bugs that mocked contexts hide.

For accessibility, `vitest-axe` wraps axe-core and catches up to 57% of WCAG issues automatically. We combine that with explicit assertions for `role="dialog"`, `aria-labelledby`, Escape-to-close, and focus trapping. The focus trap test is the one that catches the most regressions — tabbing should cycle within the tour card, not escape to the page behind it.

One gotcha with jsdom: `getBoundingClientRect()` returns zeroes. Tour positioning logic can't be tested in jsdom without mocking. We use `vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')` for basic tests and Vitest Browser Mode for anything layout-dependent.

Full tutorial with all code examples and a troubleshooting section: https://usertourkit.com/blog/unit-testing-tour-kit-components-vitest

Uses Tour Kit (our open-source headless tour library), but the patterns — provider wrappers, hook testing with act(), axe integration, storage adapter isolation — apply to any React component that relies on context and accessibility.

Curious what testing patterns others use for complex UI like tours, modals, or command palettes?
