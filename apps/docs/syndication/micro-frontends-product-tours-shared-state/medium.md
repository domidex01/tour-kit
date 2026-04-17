# Micro-Frontends and Product Tours: How to Share Onboarding State Across Federated Modules

## When your onboarding flow spans apps owned by different teams, traditional tour libraries break down. Here's what works.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/micro-frontends-product-tours-shared-state)*

Product tours assume they own the page. They expect a single React tree, a single state container, and a single DOM they can query from root to leaf. Micro-frontends break every one of those assumptions.

Your shell app loads a header from team A, a dashboard from team B, and a settings panel from team C. Each has its own React instance, its own bundler, its own deploy pipeline. Now try running a 5-step onboarding flow that starts in the header, highlights a chart in the dashboard, and ends on a settings toggle.

This is a coordination problem that most product tour libraries don't acknowledge. We tested React Joyride, Shepherd.js, and Driver.js inside a Webpack Module Federation setup with two remote apps. React Joyride couldn't target elements in the remote containers at all. Shepherd.js partially worked if elements shared the same DOM. Driver.js came closest with global DOM queries, but it has no state management or accessibility features.

## Three patterns that actually work

After testing multiple approaches, three patterns emerged:

**1. CustomEvent bus.** The simplest approach. Each micro-frontend dispatches and listens for custom events on the window object. Zero shared dependencies, works across frameworks. The downside: no type safety across module boundaries and no built-in persistence.

**2. Shared singleton via Module Federation.** Webpack Module Federation's shared configuration lets multiple remotes use the same instance of a state library. We used a Zustand vanilla store that any module can subscribe to without a React provider. The gotcha: version mismatches. We spent 2 days debugging a case where one remote ran zustand@4.5.0 and another ran zustand@5.0.0.

**3. Tour Kit with a coordination wrapper.** Run Tour Kit's headless hooks independently in each micro-frontend, then coordinate through a thin event layer. Each module manages its own accessibility features (focus trapping, keyboard navigation) while a shared orchestrator handles step sequencing across modules.

## Which one should you pick?

The CustomEvent bus works best for polyglot stacks where modules use different frameworks. If everyone's on React 18+ with coordinated deploys, the shared Zustand singleton gives the cleanest developer experience. If accessibility is non-negotiable (it should be), the Tour Kit coordination wrapper provides focus trapping and keyboard navigation without rebuilding it from scratch.

## The honest recommendation

None of these patterns are clean. Micro-frontend product tours are inherently messy because you're adding a cross-cutting concern to an architecture designed to minimize cross-cutting concerns.

If your onboarding flow can stay within a single module, keep it there. Cross-module tours should be reserved for flows that genuinely can't be scoped to one team's surface area.

Full article with complete TypeScript code examples, comparison tables, and FAQ: [usertourkit.com](https://usertourkit.com/blog/micro-frontends-product-tours-shared-state)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
