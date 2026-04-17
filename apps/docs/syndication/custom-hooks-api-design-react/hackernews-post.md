## Title: Designing hook APIs for a 10-package React library: what I got wrong and what worked

## URL: https://usertourkit.com/blog/custom-hooks-api-design-react

## Comment to post immediately after:

I built a headless product tour library (Tour Kit) that's split across 10 composable packages. The entire architecture runs on custom hooks, and I made enough mistakes along the way to write about them.

The biggest surprise was how much return value shape matters. We mixed tuple-style returns and object-style returns across hooks, and consumers couldn't keep track. Standardized on objects for anything returning 3+ values.

The most underappreciated area was accessibility in hook design. Our focus trap hook now handles focus restoration (returning focus to the previously active element when deactivated). We only added this after watching multiple consumers ship tour cards that trapped focus correctly but left focus on `<body>` when the tour ended. WCAG 2.1 SC 2.4.3 requires meaningful focus order.

Numbers that shaped our decisions: hooks-based function components produce 59.55% smaller minified bundles than class equivalents. We measured a 340ms TTI regression when our main hook returned unstable references. Memoizing every return object and callback fixed it.

Honest limitation: Tour Kit requires React 18+ because our hook design assumes concurrent mode features. React 18+ is at 85%+ adoption as of April 2026, so this felt reasonable.

The article includes actual source code from the library — the `useTour()`, `useStep()`, and `useFocusTrap()` interfaces and implementations.
