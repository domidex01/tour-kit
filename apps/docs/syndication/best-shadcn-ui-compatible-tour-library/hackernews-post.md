## Title: Comparing 7 tour libraries for shadcn/ui compatibility

## URL: https://usertourkit.com/blog/best-shadcn-ui-compatible-tour-library

## Comment to post immediately after:

shadcn/ui has 75K+ stars but no Tour component. Issue #999 was closed without implementation, and Radix UI's Discussion #1199 from 2022 shows why — the accessibility requirements for isolating page portions during a tour are genuinely hard.

I compared 7 libraries across bundle size, styling approach, headless support, React 19 compatibility, and WCAG compliance. The three architecture patterns I found:

1. Own-CSS libraries (Joyride, Shepherd, Driver.js) that require importing their stylesheets and fighting specificity to match Tailwind themes
2. shadcn-styled wrappers (shadcn/tour, Onborda) that use shadcn primitives but lock you into their component structure
3. Headless libraries (Tour Kit, OnboardJS) that provide logic without UI

The interesting finding: none of the established tour libraries (Joyride, Shepherd, Driver.js, Intro.js) make explicit WCAG 2.1 AA compliance claims in their docs.

Disclosure: I built Tour Kit, one of the libraries compared. The article includes specific bundle sizes from bundlephobia and feature comparisons for all 7 options.
