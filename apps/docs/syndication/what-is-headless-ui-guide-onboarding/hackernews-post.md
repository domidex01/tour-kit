## Title: What is headless UI? A guide for onboarding engineers

## URL: https://usertourkit.com/blog/what-is-headless-ui-guide-onboarding

## Comment to post immediately after:

I wrote this because every headless UI article I've read focuses on dropdowns and modals. Nobody connects the pattern to product tours and onboarding, where the design system mismatch is arguably worse.

The core argument: product tour libraries that ship pre-styled tooltips create CSS specificity conflicts with your design system at the exact moment you're trying to build user trust (first-run onboarding). A headless tour library separates the engine (step sequencing, focus management, ARIA attributes) from the rendering (your components, your styles).

Some data points from the guide: headless component adoption grew 70% YoY as of April 2026, the five major headless React libraries have 73K+ combined GitHub stars, and in our testing the integration time difference was roughly 2 hours (styled, overriding CSS) vs 15 minutes (headless, using existing components).

The guide traces the pattern from HOCs through render props to hooks, with specific code examples showing how a `useTour()` hook works. I also acknowledge where headless is the wrong choice, specifically when you don't have a design system yet and just need something that works quickly.

Disclosure: I built Tour Kit (one of the headless options mentioned), so I'm biased. I tried to be fair about the tradeoffs.
