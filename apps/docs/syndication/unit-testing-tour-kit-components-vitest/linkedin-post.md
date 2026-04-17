Product tour components are some of the hardest React UI to test well.

They sit at the intersection of context providers, DOM positioning, keyboard accessibility, and storage persistence. Most teams skip testing them and rely on manual QA. That works until a screen reader user reports your tour is invisible to them.

We wrote up the patterns we use with Vitest and React Testing Library:

- Provider wrapper utility (wrap in real context, never mock it)
- Automated WCAG checks with vitest-axe (catches up to 57% of a11y issues)
- Storage adapter isolation tests
- The jsdom gotcha: getBoundingClientRect() returns zeroes, so positioning needs mocks or browser mode

Vitest runs 5.6x faster than Jest on 500-test suites. That speed loop makes writing behavioral tests feel less like a chore.

Full tutorial: https://usertourkit.com/blog/unit-testing-tour-kit-components-vitest

#react #typescript #testing #accessibility #webdevelopment #opensource
