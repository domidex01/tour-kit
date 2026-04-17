## Title: Headless onboarding explained: separating tour logic from UI rendering

## URL: https://usertourkit.com/blog/headless-onboarding-explained

## Comment to post immediately after:

This is a guide to headless onboarding — the pattern where your product tour library handles behavior (step sequencing, element targeting, persistence, analytics) without rendering any UI. You bring your own components.

The motivation: most product tour libraries ship pre-styled tooltips. If your app uses Tailwind + shadcn/ui (or any design system), you end up spending more time overriding the library's CSS than building the actual tour. Headless avoids this entirely by separating the "brain" from the "looks," similar to how Radix UI handles popovers and dialogs.

Key data points from the article:
- React Joyride ships at 37KB gzipped, Shepherd.js at 25KB. A headless core can target <8KB.
- Integration time: ~2 hours of CSS overrides for styled vs ~15 minutes for headless (with existing component library)
- 85% of new React projects use utility-first CSS (State of CSS 2025), making the styled-library mismatch worse each year

The article covers architecture (three-layer split: core engine, framework adapter, your components), a comparison table of headless vs styled vs no-code, implementation steps with TypeScript, and honest tradeoffs (no visual builder, smaller community, React 18+ only).

I built Tour Kit, the headless library used in the examples. The pattern itself is library-agnostic.
