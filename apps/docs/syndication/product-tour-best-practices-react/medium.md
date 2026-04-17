# Product tour best practices for React developers (2026)

## 14 patterns from building tours across real React apps, backed by data from 550 million interactions

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-best-practices-react)*

Every "product tour best practices" article tells you to keep tours short and add progress indicators. That's fine for product managers picking a SaaS tool. But if you're building product tours in React, you need different advice.

You need to know which hooks to compose, how to handle Server Components, where to put state, what ARIA attributes to set, and how to keep your tour library from doubling your bundle.

We built User Tour Kit and shipped it across multiple React apps. The practices here come from that experience, from Chameleon's dataset of 550 million tour interactions, and from patterns we've seen work (and fail) in real codebases.

## The numbers that matter

Three-step tours hit a 72% completion rate. Seven-step tours? 16%. User-initiated tours complete at 67% while auto-triggered ones hit 31%. Self-serve tours see 123% higher completion than average.

Progress indicators improve completion by 12% and reduce dismissal by 20%.

These aren't opinions. They're patterns from Chameleon's analysis of 550 million product tour interactions.

## Why React tours need their own playbook

Generic tour best practices assume you're configuring a no-code SaaS tool. React tours are different. You're writing JSX, managing component state, handling re-renders, and dealing with the client/server boundary in Next.js.

The React 19 migration exposed this gap. As developer Sandro Roth documented, "Incompatibility with React 19 and poor accessibility are dealbreakers when evaluating tour libraries." React Joyride's next version for React 19 "doesn't work reliably," and Shepherd's React wrapper is broken entirely.

## The 14 practices (condensed)

**1. Keep tours to three steps.** One action per step.

**2. Use headless components.** Martin Fowler describes this as providing "the 'brains' of the operation but leaving the 'looks' to the developer." Your tour steps should use your design tokens.

**3. Compose with custom hooks.** Tour state composes with auth context, feature flags, and router state through React's hook model.

**4. Lazy-load tour components.** Users see onboarding once. Don't put 30KB of tour UI in your initial bundle.

**5. Handle the Server Component boundary.** Tour providers must be Client Components. Pages can be Server Components.

**6. Build accessible tours from the start.** Focus trapping, ARIA announcements, keyboard navigation. These aren't features. They're requirements.

**7. Manage state outside the tour component.** Context + reducer for simple apps (Sentry's approach). Zustand for complex apps.

**8. Use portals for positioning.** React portals + Floating UI escape stacking context issues.

**9. Let users trigger tours.** Self-serve tours complete at 123% above average.

**10. Integrate with your router.** Tour providers wrap the router outlet. MutationObserver watches for target elements after navigation.

**11. Add progress indicators.** +12% completion, -20% dismissal.

**12. Respect reduced motion.** Query `prefers-reduced-motion` and conditionally disable animations.

**13. Test tours in CI.** Unit tests for state, integration tests for flow, E2E for positioning.

**14. Track step-level analytics.** The `onDismiss` callback with `stepIndex` tells you exactly where users bail.

Full article with all code examples, comparison table, and FAQ: [usertourkit.com/blog/product-tour-best-practices-react](https://usertourkit.com/blog/product-tour-best-practices-react)

*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
