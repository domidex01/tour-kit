---
title: "The performance cost of onboarding SaaS tools: a Lighthouse audit"
slug: "onboarding-tool-lighthouse-performance"
canonical: https://usertourkit.com/blog/onboarding-tool-lighthouse-performance
tags: react, javascript, web-development, performance
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-tool-lighthouse-performance)*

# The performance cost of onboarding SaaS tools: a Lighthouse audit

You added an onboarding tool. Your Lighthouse score dropped 15 points. Nobody connected the two events until a PM noticed the regression three sprints later.

SaaS onboarding platforms like Appcues, Pendo, WalkMe, Whatfix, and Userpilot inject third-party JavaScript that competes with your app for the main thread. The cost is measurable, but no vendor publishes their script payload size. We decided to measure it ourselves.

## The key numbers

- TBT carries **30%** of the Lighthouse performance score
- Mobile median TBT is **1,916ms** (nearly 10x the 200ms target) per the 2025 Web Almanac
- A GTM container with 18 tags increases TBT **nearly 20x** (Chrome Aurora team)
- A single analytics script can drop Lighthouse score by **20 points**
- Pages render **51%** faster when third-party scripts are blocked (Opera research)

## The transparency gap

| Tool | Payload (gzipped) | Auditable? |
|------|-------------------|------------|
| Tour Kit core | <8 KB | Yes (npm) |
| Driver.js | ~5 KB | Yes (npm) |
| React Joyride | ~25 KB | Yes (npm) |
| Appcues | Not published | No |
| Pendo | Not published | No |
| WalkMe | Not published | No |
| Whatfix | Not published | No |

No SaaS vendor publishes their bundle size. Every open-source library does.

## The async loading myth

Async loading moves the penalty from FCP (10% weight) to TBT + INP (40% combined weight). That's a worse trade, not a fix.

## Measure it yourself

```bash
# Baseline without onboarding tool
npx lighthouse https://your-app.com --runs=5 --output=json

# With onboarding tool enabled
npx lighthouse https://your-app.com --runs=5 --output=json

# Compare TBT, LCP, INP
```

Full breakdown with comparison tables, code examples, and the Lighthouse 13 deprecation angle: [usertourkit.com/blog/onboarding-tool-lighthouse-performance](https://usertourkit.com/blog/onboarding-tool-lighthouse-performance)
