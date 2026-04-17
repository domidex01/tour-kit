---
title: "The 5-axis framework we use to benchmark React libraries"
published: false
description: "Most library benchmarks run a single build and declare a winner. We built a protocol with statistical significance, accessibility audits, and reproducible test environments. Here's the full methodology."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/benchmark-react-library-methodology
cover_image: https://usertourkit.com/og-images/benchmark-react-library-methodology.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/benchmark-react-library-methodology)*

# How we benchmark React libraries: methodology and tools

Most library benchmarks are theater. Someone runs a single `vite build`, screenshots the output size, and declares victory. No confidence intervals. No controlled environment. No mention of what they actually measured.

We publish comparison articles on our blog, and we got tired of other benchmarks that hand-wave through methodology. So we built a protocol. Five measurement axes, statistical significance requirements, and reproducible test setups that anyone can run themselves.

This article documents the exact methodology behind every benchmark we publish. We built Tour Kit, so any comparison involving it comes with built-in bias. Publishing our methodology is how we keep ourselves honest.

## What is a library benchmark methodology?

A library benchmark methodology is a documented, reproducible protocol for measuring how a React library affects your application across five dimensions: bundle weight, runtime speed, accessibility compliance, developer experience, and long-term maintenance health. Unlike ad hoc benchmarks that test one metric in isolation, a methodology defines controlled environments, statistical thresholds, and measurement tools before any data collection begins. As of April 2026, fewer than 5% of "benchmark comparison" blog posts in the React ecosystem describe their methodology in enough detail to reproduce the results.

## Why single-run benchmarks fail

Running `vite build` once and comparing output sizes tells you almost nothing. JavaScript engines apply JIT optimizations that vary between runs. Background processes steal CPU cycles unpredictably. Garbage collection timing shifts results by 10-30% across identical executions on the same machine.

Nolan Lawson, who built Google's Tachometer benchmarking tool, catalogs the common traps: "Measuring unintended code paths, confirmation bias ('got the answer you wanted, so you stopped looking'), cached performance skewing results, JavaScript engine optimizations eliminating test code, inadequate sample sizes."

The fix isn't complicated. Run enough iterations to reach statistical significance. Interleave tests so environment drift affects all candidates equally. Report confidence intervals, not just averages.

The Node.js project requires an independent 2-sample t-test with p < 0.05 before accepting any benchmark claim. We apply the same standard.

## The five-axis evaluation framework

A complete React library evaluation requires measuring five distinct axes: bundle weight, runtime performance, accessibility compliance, developer experience, and maintenance health.

| Axis | What we measure | Primary tool | Pass threshold |
|------|----------------|-------------|----------------|
| Bundle weight | Gzipped production size, tree-shaking effectiveness, dependency count | source-map-explorer + bundlephobia | <15KB gzipped for a tour library |
| Runtime performance | Initialization time, re-render cost, INP impact, memory allocation | Tachometer + Chrome DevTools | INP <200ms with library active |
| Accessibility | axe-core violations, keyboard navigation, screen reader announcements | axe-core + manual audit | Zero critical/serious violations |
| Developer experience | Time-to-first-component, TypeScript coverage, API surface area | Stopwatch + TS compiler | Under 30 min to working tour |
| Maintenance health | Commit frequency, open issue age, React 19 support, breaking changes per year | GitHub API + npm registry | Active within 90 days |

No library wins all five. Tour Kit scores well on bundle weight and accessibility but has a smaller community than React Joyride (603K weekly npm downloads as of April 2026). That's a real tradeoff, and a methodology that ignores it is just marketing.

## Axis 1: bundle weight analysis

Bundle weight analysis measures the gzipped bytes a library adds to your production JavaScript after tree-shaking, not the number reported on its npm page or GitHub README.

We measure three things for each library:

1. **Bundlephobia baseline:** the published package size as a sanity check
2. **Production build size:** `vite build` with the library imported into an identical test app, measured via `source-map-explorer` against the generated source maps
3. **Tree-shaking effectiveness:** import a single function, then measure whether unused code gets eliminated

```tsx
// benchmark/measure-bundle.ts
import { execSync } from "node:child_process";

const libraries = ["@tourkit/core", "react-joyride", "shepherd.js", "driver.js"];

for (const lib of libraries) {
  execSync(`rm -rf node_modules/.vite`);
  execSync(`vite build --mode production`);

  const output = execSync(
    `npx source-map-explorer dist/assets/*.js --json`
  ).toString();

  const data = JSON.parse(output);
  const libBytes = data.results
    .filter((r: { bundleName: string }) => r.bundleName.includes(lib))
    .reduce((sum: number, r: { totalBytes: number }) => sum + r.totalBytes, 0);

  console.log(`${lib}: ${(libBytes / 1024).toFixed(1)}KB (raw), source-map-explorer`);
}
```

## Axis 2: runtime performance profiling

Runtime performance profiling measures how a React library affects initialization speed, interaction responsiveness (INP), memory allocation, and re-render cost under controlled conditions with CPU throttling that simulates real-world devices.

We use [Tachometer](https://nolanlawson.com/2024/08/05/reliable-javascript-benchmarking-with-tachometer/) for automated benchmarks because it runs iterations until reaching statistical significance and launches fresh browser profiles between runs.

What we measure:

- **Initialization time:** mount the tour provider, measure time to first interactive step
- **Step transition cost:** navigate between steps, measure INP
- **Memory allocation:** heap snapshots before and after a complete tour run
- **Re-render impact:** React Profiler API measuring render counts and durations

Google evaluates Core Web Vitals at the 75th percentile of real visitor data. We apply the same standard: p75, not averages, across at least 30 iterations.

## Axis 3: accessibility auditing

Lighthouse catches roughly 30-50% of accessibility issues. Our benchmark adds manual testing on top:

```tsx
// benchmark/a11y-audit.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("tour accessibility audit", async ({ page }) => {
  await page.goto("/benchmark/tour-active");
  await page.waitForSelector("[data-tour-step]");

  const results = await new AxeBuilder({ page })
    .include("[data-tour-overlay], [data-tour-step], [role='dialog']")
    .analyze();

  expect(results.violations.filter(v => v.impact === "critical")).toHaveLength(0);
});
```

We also test keyboard navigation (Tab/Escape/Arrow keys), screen reader announcements (VoiceOver on macOS, NVDA on Windows), and focus trap behavior.

## Axis 4: developer experience metrics

- **Time-to-first-tour:** from `npm install` to a working 3-step tour, measured with a stopwatch three times per library
- **Lines of code:** for an identical 5-step tour with tooltip, highlight, and navigation buttons
- **TypeScript coverage:** does autocomplete work for step configuration?
- **API surface area:** total exports count

## Axis 5: maintenance health signals

- **Last commit date:** anything older than 90 days gets flagged
- **Open issue median age:** how fast does the maintainer respond?
- **React version support:** does it work with React 19?
- **Breaking changes per year:** frequent major versions signal an unstable API

## Common mistakes we've learned to avoid

**Benchmarking development builds.** Don't. React's development mode adds timing instrumentation, StrictMode double-renders, and console warnings that don't exist in production.

**Measuring the wrong thing.** One library looked 40% slower until we realized our test page had a layout shift triggering extra re-renders unrelated to the tour library.

**Ignoring tree-shaking.** A library reporting 8KB on bundlephobia might actually contribute 15KB to your production bundle if it doesn't tree-shake well.

**Skipping accessibility.** A library can score perfectly on bundle and runtime axes while shipping inaccessible overlays that trap focus incorrectly.

## Tools we use

| Category | Tool | Why this one |
|----------|------|-------------|
| Bundle analysis | source-map-explorer | Per-file byte attribution via source maps |
| Pre-install sizing | Bundlephobia | Quick cross-check, not authoritative for tree-shaken builds |
| Runtime benchmarks | Tachometer | Auto-determines sample size, reports confidence intervals |
| Profiling | Chrome DevTools + React Profiler | React Performance Tracks (19.2+) show component-level timing |
| Accessibility | axe-core via Playwright | Same engine as Lighthouse a11y, but in real browser DOM |
| CWV measurement | web-vitals library + CrUX | Lab data for dev, field data for production |
| CI integration | GitHub Actions | Consistent environment, eliminates local machine variance |

---

Full article with all code examples and comparison tables: [usertourkit.com/blog/benchmark-react-library-methodology](https://usertourkit.com/blog/benchmark-react-library-methodology)
