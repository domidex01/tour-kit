# Everything developers ask before installing a product tour library

### The 20 questions that come up every time, answered with data

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-faq)*

You found a product tour library. The README looks promising. But before you run the install command, you have questions. Does it actually work with React 19? Will it fight your Tailwind setup? What's the catch with the free tier?

We built Tour Kit, an open-source headless product tour library for React. We're biased, and we're also the best people to answer these questions honestly. Every claim below is verifiable against npm, GitHub, or bundlephobia.

## Does it work with React 19?

Tour Kit supports React 18 and React 19 natively. This matters because the most popular alternative hasn't kept up. As of April 2026, React Joyride hasn't been updated in 9 months and isn't compatible with React 19.

If you're evaluating tour libraries in 2026, the first question should be: does this actually run on my React version?

## How big is the bundle?

The bundle size spread across tour libraries is enormous. Tour Kit's core is under 8KB gzipped with zero dependencies. React Joyride is 498KB unpacked. Driver.js comes in at ~5KB but isn't React-specific.

The recommendation from LogRocket: "Tour libraries should be loaded dynamically rather than included in the initial bundle."

## Does it work with Tailwind and shadcn/ui?

This is one of the main reasons Tour Kit exists. React Joyride relies on inline styles without custom class name support. Shepherd.js uses HTML strings instead of JSX for custom content.

Tour Kit renders nothing. You pass your own components. No CSS specificity wars.

## How is accessibility handled?

Tour Kit targets WCAG 2.1 AA compliance with proper ARIA attributes, focus trapping, and keyboard navigation. Not every library gets this right. An audit of Intro.js found missing aria-labelledby attributes, buttons implemented as links, and no focus trap.

## Tour Kit vs React Joyride

React Joyride has 400,000+ weekly npm downloads. It's the most popular option. Tour Kit is younger and smaller. The key difference is architecture: Tour Kit is headless (you bring your own UI), Joyride is opinionated (it ships its own tooltip).

Choose Joyride if you want a working tour in 10 minutes and don't mind the default UI. Choose Tour Kit if you need design system integration, React 19, or care about bundle size.

## What's the licensing?

Core packages are MIT, free for commercial use. Extended packages (analytics, checklists, surveys) are $99 one-time per project. No per-user pricing.

## Does Tour Kit collect user data?

No. It runs entirely in the browser. No telemetry, no accounts, no phone-home. Tour state stays wherever you configure it.

---

The full article covers 20 questions with comparison tables and TypeScript code examples: [usertourkit.com/blog/tour-kit-faq](https://usertourkit.com/blog/tour-kit-faq)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
