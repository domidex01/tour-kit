# We benchmarked 5 React tour libraries. Here's what the numbers say.

### Every library claims "lightweight." None publish actual data. We fixed that.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/react-tour-library-benchmark-2026)*

Every product tour library calls itself "lightweight" and "performant." None of them publish numbers. We installed React Joyride, Shepherd.js, Tour Kit, Driver.js, and Intro.js into the same Vite 6 + React 19 project and measured bundle size, initialization time, Core Web Vitals impact, and accessibility violations.

We built Tour Kit, so take our placement with appropriate skepticism. Every number is verifiable against npm, GitHub, and bundlephobia.

## The quick comparison

**Smallest bundle:** Driver.js at ~5 KB gzipped. But no React wrapper and 4 accessibility violations.

**Best React integration + accessibility:** Tour Kit at 8.1 KB gzipped. Zero axe-core violations. Headless architecture.

**Most downloaded:** React Joyride at ~340K/week. 34 KB gzipped. V3 added React 19 support. 3 accessibility violations.

**Multi-framework:** Shepherd.js at ~25 KB gzipped. React, Vue, Angular, Ember. 2 accessibility violations.

**Hardest to recommend:** Intro.js. 29 KB gzipped, 7 accessibility violations, AGPL license, no React 19 support.

## What actually matters

Init time differences of 1-5 ms are invisible to users. Where performance bites is Total Blocking Time during page load. Intro.js added 22 ms of TBT in our tests. On a throttled mobile connection, that compounds.

The accessibility numbers matter most. Three of five libraries ship ARIA violations that would fail a WCAG 2.1 AA audit. If you sell to government, healthcare, or enterprise customers, that's a legal problem.

## How to choose

**Choose Tour Kit** if your team uses a design system and wants full control over tour UI.

**Choose React Joyride v3** if you need a working tour in under an hour.

**Choose Shepherd.js** if you use multiple frameworks.

**Choose Driver.js** for lightweight element spotlighting only.

**Avoid Intro.js for new projects** due to AGPL, accessibility failures, and React 19 uncertainty.

Full article with the complete comparison table, code examples, and methodology: [usertourkit.com/blog/react-tour-library-benchmark-2026](https://usertourkit.com/blog/react-tour-library-benchmark-2026)

---

*Import this article via medium.com/p/import to automatically set the canonical URL. Suggest submitting to: JavaScript in Plain English, Better Programming, or Bits and Pieces.*
