# Why we split our React library into 10 packages (and what we'd do differently)

*A building-in-public walkthrough of composable monorepo architecture*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/composable-tour-library-architecture)*

Most product tour libraries ship as one npm package. You install everything whether you need tooltips, analytics, scheduling, or surveys. If you only want step sequencing and a tooltip, you still pay for the rest in your bundle.

Tour Kit takes a different approach. It ships 10 separate packages, each tree-shakeable, each with its own TypeScript declarations. A basic tour pulls in the core (under 8KB gzipped) and the React layer. Need surveys? Add the surveys package. Need analytics? Add the analytics package with a PostHog or Mixpanel plugin.

I built Tour Kit as a solo developer. This article is a walkthrough of how that architecture works, what went wrong, and what I'd do differently.

## The problem with monolithic libraries

When we measured React Joyride's impact on a production Next.js app, it added 37KB gzipped to the client bundle. That includes every feature, every tooltip variant, every callback handler. Loaded on every page whether the user sees a tour or not.

Users who complete an onboarding tour are 2.5x more likely to convert to paid (Appcues 2024 Benchmark Report). But that conversion gain disappears if the tour library itself degrades page load.

## The composable approach

Tour Kit's 10 packages each map to a distinct user intent:

- Core + React + Hints: the foundation (MIT licensed)
- Analytics: plugin architecture for PostHog, Mixpanel, Amplitude, GA4
- Announcements: 5 display variants (modal, slideout, banner, toast, spotlight)
- Surveys: NPS, CSAT, CES scoring with fatigue prevention
- Checklists, Media, Scheduling, Adoption: each solving one problem

Every extended package depends on the core. None depend on each other as hard requirements.

## What we got right

**Headless core, thin wrappers.** Martin Fowler calls this the headless component pattern. Tour Kit's core package has 62 source files with zero UI, zero CSS. All hooks, utilities, and types. The React layer wraps these hooks into components.

**Bundle size budgets as CI checks.** Core must stay under 8KB gzipped. React under 12KB. If a PR exceeds the budget, the build fails. Not aspirational targets. Enforced gates.

**Centralized accessibility.** Focus traps, keyboard navigation, and screen reader announcements all live in core. UI packages inherit them. Consistent behavior across all 10 packages.

## What we got wrong

**Media should have been part of announcements.** Media embeds (YouTube, Vimeo, Loom) are almost exclusively used inside announcement content. Separate package means two installs for a common use case.

**Code splitting interacts poorly with re-exports.** tsup's splitting option caused duplicate chunks when analytics re-exported types from core. We disabled splitting for two packages specifically.

**Testing multiplies fast.** Each package has its own test suite, its own mock setup. Integration tests that verify cross-package behavior need explicit fixtures.

## Key takeaways

1. Start with one package. Split when users want subsets, not before.
2. Map packages to user intents, not technical layers.
3. Set bundle size budgets and enforce them in CI.
4. Accept the duplication tax. Copying 40 lines of utility code across 7 packages is better than a shared utility package.
5. Package boundaries are public API. Once published to npm, they're contracts.

As of April 2026, Gartner reports 70% of organizations have adopted composable technology patterns. The approach is mainstream. The hard part is deciding where to draw the lines.

---

Full article with dependency graphs, tsup configuration, and code examples: [usertourkit.com/blog/composable-tour-library-architecture](https://usertourkit.com/blog/composable-tour-library-architecture)
