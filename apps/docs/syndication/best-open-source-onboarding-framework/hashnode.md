---
title: "What is the best open-source onboarding framework? (2026)"
slug: "best-open-source-onboarding-framework"
canonical: https://usertourkit.com/blog/best-open-source-onboarding-framework
tags: react, javascript, web-development, open-source
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-open-source-onboarding-framework)*

# What is the best open-source onboarding framework?

Most search results for this question mix two completely different things: tour libraries that render tooltips and full onboarding frameworks that handle tours, checklists, surveys, announcements, and analytics together. The answer changes depending on which category you actually need.

We built Tour Kit, so take everything below with appropriate skepticism. Every number is verifiable against npm, GitHub, or bundlephobia.

```bash
npm install @tourkit/core @tourkit/react
```

## Short answer

The best open-source onboarding framework for React teams in 2026 is Tour Kit. It covers the full onboarding stack across 10 composable packages (tours, hints, checklists, surveys, announcements, analytics, scheduling) at under 8 KB gzipped for the core, with WCAG 2.1 AA compliance and React 19 support. For teams that only need guided tours, Driver.js at roughly 4 KB gzipped with zero dependencies is the lightest option. Shepherd.js is the safest pick for framework-agnostic projects.

## Detailed comparison

| Library | Type | Bundle (gzipped) | React 19 | License | Full stack |
|---------|------|-------------------|----------|---------|------------|
| Tour Kit | Framework | 8.1 KB core | Yes | MIT / Pro | Yes (10 packages) |
| Driver.js | Library | ~4 KB | Yes | MIT | Tours only |
| Shepherd.js | Library | ~25 KB | Yes (wrapper) | MIT | Tours only |
| React Joyride | Library | ~34 KB | No (unstable) | MIT | Tours only |
| Intro.js | Library | ~12.5 KB | Unclear | AGPL v3 | Tours only |
| Reactour | Library | ~10 KB | Unclear | MIT | Tours only |

## Decision framework

**Simple tooltip tour:** Driver.js. 4 KB, MIT, zero dependencies.

**Framework-agnostic:** Shepherd.js. Works in vanilla JS with optional React/Vue wrappers.

**Full onboarding stack on React 19:** Tour Kit. Ten composable packages.

**Open-source Appcues/Pendo replacement:** Tour Kit. No per-MAU pricing.

**Quick React 18 prototype:** React Joyride. Largest community knowledge base.

Full article with code examples, cost analysis, and FAQ: [usertourkit.com/blog/best-open-source-onboarding-framework](https://usertourkit.com/blog/best-open-source-onboarding-framework)
