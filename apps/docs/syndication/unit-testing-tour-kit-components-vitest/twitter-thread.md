## Thread (6 tweets)

**1/** Product tour components are some of the hardest React UI to test. Context providers, keyboard nav, ARIA attributes, storage persistence — most teams just skip it.

Here's how we test ours with Vitest + RTL:

**2/** The #1 mistake: mocking React context.

RTL's docs say it directly — wrap in real providers with controlled values. We built a `renderWithProviders()` utility with Tour Kit's `createTour()` factory. Catches bugs that mocked contexts hide.

**3/** For accessibility, vitest-axe wraps axe-core and catches up to 57% of WCAG issues automatically.

We combine it with explicit assertions:
- role="dialog" exists
- aria-labelledby is set
- Escape closes the tour
- Tab cycles within the card

**4/** The jsdom gotcha nobody mentions: `getBoundingClientRect()` returns all zeroes.

Tour positioning can't be tested without `vi.spyOn()` mocks or Vitest Browser Mode. We use mocks for basic logic, browser mode for layout.

**5/** Vitest vs Jest for component tests:
- Cold start: 200ms vs 2-4s
- 500 tests: 8s vs 45s (5.6x faster)
- Watch mode: 380ms vs 3.4s

Native TypeScript + ESM. No ts-jest config.

**6/** Full tutorial with all code examples, troubleshooting (act warnings, provider-not-found), and FAQ:

https://usertourkit.com/blog/unit-testing-tour-kit-components-vitest

Patterns apply to any context-heavy React component, not just tours.
