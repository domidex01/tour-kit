## Subreddit: r/reactjs (primary), r/shadcn (secondary)

**Title:** I compared 7 tour libraries for shadcn/ui compatibility — here's what I found

**Body:**

shadcn/ui Issue #999 asked for a Tour component back in 2023. It was closed without implementation. Radix UI has the same gap — Discussion #1199 from 2022 shows developers asking for tour functionality, and a maintainer explained the accessibility challenges involved.

I needed a product tour for a shadcn/ui project and found three types of libraries:

1. **Own-CSS libraries** (React Joyride, Shepherd.js, Driver.js, Intro.js) — they all ship their own stylesheets. Getting them to match your Tailwind theme means fighting CSS specificity.

2. **shadcn-styled wrappers** (shadcn/tour, Onborda) — they use shadcn primitives natively, but you're locked into their component structure. Less flexibility.

3. **Headless libraries** (Tour Kit, OnboardJS) — they provide tour logic (step sequencing, highlighting, focus management) without any UI. You render with your own shadcn Card, Button, Popover, etc.

The key data points from my comparison:

- Driver.js is the smallest at ~5KB gzipped, but no shadcn integration
- React Joyride has the most downloads (2.5x second place), but its own CSS system
- Shepherd.js at ~25KB is the heaviest, but works outside React
- Tour Kit's core is <8KB gzipped and was designed specifically for the shadcn/Radix/Tailwind stack
- None of the established libraries (Joyride, Driver, Shepherd, Intro.js) make explicit WCAG 2.1 AA compliance claims

Disclosure: I built Tour Kit, so I'm obviously biased. But the comparison table in the article includes specific bundle sizes, styling approaches, and React 19 support for all 7 libraries. Every data point is verifiable against npm and bundlephobia.

Full article with comparison table and code examples: https://usertourkit.com/blog/best-shadcn-ui-compatible-tour-library

Has anyone else dealt with the shadcn + tour library styling mismatch? Curious what approaches you've tried.
