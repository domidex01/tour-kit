Product tours are modal dialogs chained into a sequence. Each one triggers specific WCAG 2.1 AA obligations.

Most tour libraries fail at least three of them.

I mapped all 16 WCAG success criteria that apply to product tour implementations. The most common failures:

- Focus doesn't move into the tour step when it opens (keyboard users don't know the tour started)
- No focus trap while the step is active (Tab reaches background content)
- No screen reader announcement when steps change

A data point that reframes the conversation: in 2024, 722 of 3,188 ADA lawsuits targeted sites that already had an accessibility overlay installed. Having a widget didn't prevent the lawsuit.

With the DOJ's April 24, 2026 deadline for WCAG 2.1 AA and the European Accessibility Act already enforceable since June 2025, this isn't optional for teams shipping onboarding flows.

Full mapping with code examples and a library comparison table: https://usertourkit.com/blog/wcag-requirements-product-tour

#accessibility #react #webdevelopment #wcag #productdevelopment
