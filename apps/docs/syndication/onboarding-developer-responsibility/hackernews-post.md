## Title: Onboarding is a developer problem, not a product manager problem

## URL: https://usertourkit.com/blog/onboarding-developer-responsibility

## Comment to post immediately after:

I wrote this after watching the same pattern play out at multiple SaaS companies: PM configures product tours in a no-code tool, third-party scripts get injected into production, and when something breaks (performance regression, accessibility failure, hydration conflict with React 19), the developer gets paged. Not the PM.

The core argument has three parts:

1. There's an accountability vacuum. No-code onboarding tools let PMs push production changes without engineering review. When those changes cause regressions, nobody clearly owns the aftermath. ProductPlan themselves acknowledged PMs "may not feel the same level of ownership" for onboarding as other features.

2. WCAG 2.1 SC 4.1.2 explicitly scopes custom UI component accessibility to "web authors who develop or script their own user interface components." Product tours are custom UI components. Accessibility compliance for tours is structurally a developer problem.

3. The "build vs. buy" framing is outdated. It assumes building means $50-150K in custom engineering. Open-source libraries like the one I built (Tour Kit, <8KB gzipped) collapse that assumption. The real choice is SaaS subscription vs. code ownership at near-zero cost.

I try to steelman the other side too. No-code tools genuinely help teams iterate faster (25% higher activation for weekly iterators), and at the very earliest stage they might be the right call. But the argument that removing developers from the loop is a feature has always felt wrong to me.

Curious if others have seen this accountability gap play out differently.
