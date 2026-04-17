---
title: "What are the best Appcues alternatives for developers?"
slug: "best-appcues-alternatives-developers"
canonical: https://usertourkit.com/blog/best-appcues-alternatives-developers
tags: react, javascript, web-development, developer-tools
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-appcues-alternatives-developers)*

# What are the best Appcues alternatives for developers?

Appcues starts at $249 per month, injects a ~180 KB third-party script outside your React component tree, and gates custom CSS behind its Growth plan. If your engineering team wants to own the onboarding experience in code rather than hand it to a product manager with a visual builder, seven alternatives give you more control for less money.

We built Tour Kit, one of the tools on this list. Take our recommendations with that context. Every data point below is verifiable against npm, GitHub, or the vendor's public pricing page.

```bash
npm install @tourkit/core @tourkit/react
```

## Short answer

The best Appcues alternative for developers depends on your constraints. Tour Kit gives React teams full design control at 8.1 KB gzipped with zero runtime dependencies, MIT-licensed, and $99 one-time for Pro features. Flows.sh is strong if you want a managed service with a developer-first API. React Joyride works for quick prototypes that don't need React 19. If bundle size matters most, Driver.js ships at 5 KB but requires DOM manipulation outside React's model.

## Comparison table

| Tool | Type | Bundle / Script | React 19 | WCAG 2.1 AA | Price | Best for |
|------|------|----------------|----------|-------------|-------|----------|
| Tour Kit | Library | ~8 KB gzipped | Yes | Yes | $0 MIT / $99 one-time Pro | React devs who want code ownership |
| Flows.sh | Managed service | SDK-based | Yes | Yes | Free tier / paid plans | Teams wanting managed infra + dev API |
| React Joyride | Library | ~45 KB gzipped | No | Partial | Free (MIT) | Quick prototypes, legacy React apps |
| Shepherd.js | Library | ~25 KB gzipped | Via wrapper | Partial | Free (AGPL) / Commercial | Multi-framework teams |
| Driver.js | Library | ~5 KB gzipped | No React wrapper | No | Free (MIT) | Minimal spotlight highlighting |
| Intro.js | Library | ~15 KB gzipped | No React wrapper | Partial | Free (AGPL) / $9.99+ | Simple step-by-step intros |
| OnboardJS | Library + SaaS | SDK-based | Yes | Yes | Free (OSS) / $59/mo SaaS | Headless + managed analytics |

## Decision framework

**Full design control:** Tour Kit. Renders your components with shadcn/ui, Radix, or Tailwind.

**Managed infrastructure:** Flows.sh. SDK in your code, analytics on their platform.

**Quick prototype:** React Joyride. 603K weekly downloads, works out of the box (no React 19).

**Multi-framework:** Shepherd.js. Vue, Angular, Ember, React — but AGPL licensed.

**Smallest bundle:** Driver.js at 5 KB. Vanilla JS, no React integration.

**Headless + analytics:** OnboardJS. $59/month vs Tour Kit's $99 one-time.

Full article with code examples and detailed analysis: [usertourkit.com/blog/best-appcues-alternatives-developers](https://usertourkit.com/blog/best-appcues-alternatives-developers)
