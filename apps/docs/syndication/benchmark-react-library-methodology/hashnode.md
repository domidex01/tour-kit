---
title: "How we benchmark React libraries: methodology and tools"
slug: "benchmark-react-library-methodology"
canonical: https://usertourkit.com/blog/benchmark-react-library-methodology
tags: react, javascript, web-development, performance, testing
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/benchmark-react-library-methodology)*

# How we benchmark React libraries: methodology and tools

Most library benchmarks are theater. Someone runs a single `vite build`, screenshots the output size, and declares victory. No confidence intervals. No controlled environment. No mention of what they actually measured.

We publish comparison articles on our blog, and we got tired of other benchmarks that hand-wave through methodology. So we built a protocol. Five measurement axes, statistical significance requirements, and reproducible test setups that anyone can run themselves.

This article documents the exact methodology behind every benchmark we publish. We built Tour Kit, so any comparison involving it comes with built-in bias. Publishing our methodology is how we keep ourselves honest.

## The five-axis evaluation framework

| Axis | What we measure | Primary tool | Pass threshold |
|------|----------------|-------------|----------------|
| Bundle weight | Gzipped production size, tree-shaking effectiveness | source-map-explorer + bundlephobia | <15KB gzipped |
| Runtime performance | Init time, re-render cost, INP impact, memory | Tachometer + Chrome DevTools | INP <200ms |
| Accessibility | axe-core violations, keyboard nav, screen reader | axe-core + manual audit | Zero critical violations |
| Developer experience | Time-to-first-component, TypeScript coverage, API surface | Stopwatch + TS compiler | Under 30 min |
| Maintenance health | Commit frequency, issue age, React 19 support | GitHub API + npm registry | Active within 90 days |

## Why single-run benchmarks fail

Running `vite build` once tells you almost nothing. Garbage collection timing alone shifts results by 10-30% across identical executions on the same machine.

Nolan Lawson (Google's Tachometer) catalogs the traps: "Measuring unintended code paths, confirmation bias, cached performance skewing results, JavaScript engine optimizations eliminating test code, inadequate sample sizes."

The Node.js project requires an independent 2-sample t-test with p < 0.05. We apply the same standard.

## Bundle weight analysis

We measure three things:

1. **Bundlephobia baseline** as a sanity check
2. **Production build size** via `source-map-explorer` against source maps
3. **Tree-shaking effectiveness** by importing a single function

```tsx
// benchmark/measure-bundle.ts
import { execSync } from "node:child_process";

const libraries = ["@tourkit/core", "react-joyride", "shepherd.js", "driver.js"];

for (const lib of libraries) {
  execSync(`rm -rf node_modules/.vite`);
  execSync(`vite build --mode production`);
  const output = execSync(`npx source-map-explorer dist/assets/*.js --json`).toString();
  const data = JSON.parse(output);
  const libBytes = data.results
    .filter((r: { bundleName: string }) => r.bundleName.includes(lib))
    .reduce((sum: number, r: { totalBytes: number }) => sum + r.totalBytes, 0);
  console.log(`${lib}: ${(libBytes / 1024).toFixed(1)}KB`);
}
```

## Accessibility auditing

Lighthouse catches 30-50% of issues. We add axe-core in Playwright plus manual keyboard/screen reader testing:

```tsx
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

## Common mistakes to avoid

- **Benchmarking dev builds** — React dev mode adds instrumentation that doesn't exist in production
- **Measuring the wrong variable** — isolate the library from unrelated layout shifts
- **Ignoring tree-shaking** — 8KB on bundlephobia can become 15KB in your actual build
- **Skipping accessibility** — a fast, small library that breaks focus management isn't actually better

Full article with all five axes, tools table, and reproducible test setup: [usertourkit.com/blog/benchmark-react-library-methodology](https://usertourkit.com/blog/benchmark-react-library-methodology)
