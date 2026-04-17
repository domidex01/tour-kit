---
title: "Which product tour libraries support TypeScript?"
slug: "product-tour-libraries-typescript-support"
canonical: https://usertourkit.com/blog/product-tour-libraries-typescript-support
tags: typescript, react, javascript, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-libraries-typescript-support)*

# Which product tour libraries support TypeScript?

Most product tour libraries claim TypeScript support. Fewer actually deliver it. A library can ship `.d.ts` files and still resolve your step config to `any` after a minor version bump. Or silently drop generic support in a patch release.

We installed eight tour libraries into a Vite 6 + React 19 + TypeScript 5.7 strict-mode project and checked what actually works: autocomplete, generic step types, strict-mode compilation, and whether the types stay accurate across versions.

**Bias disclosure:** We built Tour Kit, so it appears in this comparison. Every claim is verifiable against npm, GitHub, and bundlephobia.

## Short answer

As of April 2026, six of the eight major product tour libraries ship with TypeScript support, but only three are written in TypeScript from the ground up with full strict-mode compatibility: Tour Kit, Driver.js, and Onborda.

## TypeScript support compared

| Library | TS origin | Strict mode | Generic steps | React 19 | Bundle (gzip) | License |
|---------|-----------|-------------|---------------|----------|---------------|---------|
| Tour Kit | Native (strict) | ✅ | ✅ | ✅ | <8KB core | MIT |
| Driver.js | Native | ✅ | ❌ | ✅ (vanilla) | ~5KB | MIT |
| Onborda | Native | ✅ | ❌ | ✅ | ~8KB + Motion | MIT |
| React Joyride | Own declarations | ⚠️ Step → any | ❌ | ❌ (9 months stale) | ~30KB | MIT |
| Shepherd.js | Retrofitted | ⚠️ Wrapper broken | ❌ | ⚠️ Wrapper issues | ~25KB | MIT |
| NextStepjs | Native | ✅ | ❌ | ✅ | Small + Motion | MIT |
| Intro.js | @types (outdated) | ❌ | ❌ | ⚠️ Via wrapper | ~12.5KB | AGPL |
| Reactour | Has types | ⚠️ Partial | ❌ | ✅ | ~15KB | MIT |

Read the full comparison with code examples and decision framework at [usertourkit.com/blog/product-tour-libraries-typescript-support](https://usertourkit.com/blog/product-tour-libraries-typescript-support).
