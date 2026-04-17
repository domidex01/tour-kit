---
title: "8 Chameleon alternatives compared: pricing, bundle size, and accessibility (2026)"
published: false
description: "We tested 8 Chameleon alternatives in a React 19 project and ran axe-core audits on every tour overlay. Here's what we found on pricing, performance, and WCAG compliance."
tags: react, javascript, webdev, opensource
canonical_url: https://usertourkit.com/blog/best-chameleon-alternatives
cover_image: https://usertourkit.com/og-images/best-chameleon-alternatives.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-chameleon-alternatives)*

# 8 best Chameleon alternatives in 2026

Chameleon charges an average of $30,000 per year according to Vendr marketplace data, locks features behind plan-based limits, and injects a third-party script that sits outside your React component tree. If you're a developer who wants accessible product tours without per-MTU pricing and opaque contracts, there are better options. We tested eight alternatives and compared them on what actually matters to a frontend team: price, bundle size, React integration, and accessibility compliance.

```bash
npm install @tourkit/core @tourkit/react
```

Full disclosure: Tour Kit is our project. We've tried to be fair, but you should know that going in. Every claim below is verifiable against npm, GitHub, or bundlephobia.

## How we evaluated these tools

We installed each library (or signed up for each SaaS platform) and built the same 5-step onboarding tour in a Vite 6 + React 19 + TypeScript 5.7 project. For SaaS tools that inject scripts rather than install as packages, we measured the external script payload with Chrome DevTools.

Criteria:

- Bundle size or script weight (gzipped)
- React 19 support and component-model integration
- WCAG 2.1 AA accessibility (focus management, keyboard nav, ARIA attributes)
- Pricing at 2,500 MAU/MTU scale
- Setup time to first working tour
- Data portability and lock-in risk

We ran axe-core audits against each tour overlay. Not a single SaaS competitor passed without violations. That wasn't surprising but it was revealing.

## Quick comparison table

| Tool | Type | Bundle / Script | React 19 | WCAG 2.1 AA | Price (2,500 MAU) | Best for |
|------|------|-----------------|----------|-------------|-------------------|----------|
| Tour Kit | Library | ~8KB core gzipped | ✅ | ✅ | $0 (MIT) / $99 one-time Pro | React devs who want code ownership |
| Appcues | SaaS | ~180KB script | ⚠️ Injected | ❌ | $249/mo | Product teams without developers |
| Userpilot | SaaS | ~200KB script | ⚠️ Injected | ❌ | $299/mo | Teams needing built-in analytics |
| Pendo | SaaS | ~250KB script | ⚠️ Injected | ❌ | Free (500 MAU) / enterprise | Enterprise product analytics |
| UserGuiding | SaaS | ~150KB script | ⚠️ Injected | ❌ | $249/mo | Budget-conscious no-code teams |
| Product Fruits | SaaS | ~120KB script | ⚠️ Injected | ❌ | $96/mo (1,500 MAU) | SMBs wanting quick setup |
| Shepherd.js | Library | ~25KB gzipped | ⚠️ Wrapper | ❌ | $0 (AGPL) | jQuery-era apps needing tours |
| React Joyride | Library | ~37KB gzipped | ⚠️ Partial | ❌ | $0 (MIT) | Quick prototypes with built-in UI |

Script sizes for SaaS tools are approximate, measured via Chrome DevTools Network tab in April 2026. Library sizes from bundlephobia.

## 1. Tour Kit: best for React developers who want code ownership

Tour Kit is a headless, composable product tour library built specifically for React 18 and 19. With a core bundle under 8KB gzipped, it ships tour logic without prescribing UI, so you render steps with your own components. As of April 2026, it's the only product tour tool we've found that documents and tests WCAG 2.1 AA compliance, including focus management, keyboard navigation, ARIA live regions, and skip-to-content buttons.

**Strengths:**
- Ships 10 composable packages: install only what you need
- Full TypeScript strict-mode coverage with exported types for every hook and component
- Works natively with shadcn/ui, Radix, Tailwind, or any design system
- No per-MTU pricing, no contracts, no injected scripts

**Limitations:**
- No visual builder. You write JSX.
- Smaller community than React Joyride (603K weekly npm downloads) or Shepherd.js (67K)
- React 18+ only
- Younger project with less battle-testing at enterprise scale

**Pricing:** Free forever (MIT open source). Pro features available for $99 one-time purchase.

## 2. Appcues: best for product teams without developers

Appcues is a SaaS onboarding platform that starts at $249/month for 2,500 MAU on the Essentials plan. It's the most cross-channel option here, offering in-app tours, modals, banners, email, push notifications, and mobile SDKs for iOS and Android. Setup genuinely takes hours, not days.

**Strengths:**
- Cross-channel: email + push + mobile + in-app from one dashboard
- Fastest time-to-first-tour among the SaaS options we tested
- 14-day free trial with no credit card required

**Limitations:**
- $249/month adds up to $2,988/year at the lowest tier, and grows with MAU count
- Injects an external script (~180KB) outside React's component model
- No WCAG documentation

**Pricing:** Essentials: $249/mo (2,500 MAU). Growth: custom. Enterprise: custom.

## 3. Userpilot: best for built-in product analytics

Userpilot starts at $299/month and differentiates by bundling product analytics directly into the onboarding platform. It offers autocapture, session replays, and event tracking that Chameleon charges extra for.

**Strengths:**
- Built-in analytics: autocapture, session replays, funnel analysis without a separate tool
- NPS and microsurvey support included on all plans

**Limitations:**
- $299/month entry price is the highest among pure onboarding tools here
- External script injection (~200KB) with no React component integration
- Zero accessibility documentation

**Pricing:** Starter: $299/mo. Growth: custom. Enterprise: custom.

## 4. Pendo: best free tier for enterprise product analytics

Pendo offers a genuinely free tier (500 MAU) that includes product analytics, in-app guides, and a feedback module. Paid plans are enterprise-priced and opaque.

**Strengths:**
- Free tier includes analytics, guides, and feedback (500 MAU cap)
- Strongest product analytics of any onboarding tool
- Mobile SDKs for iOS and Android

**Limitations:**
- Paid plans require talking to sales. Community forums report costs starting at $25,000+/year.
- Heaviest script we measured at ~250KB

**Pricing:** Free: $0 (500 MAU). Paid: custom (expect $25K+/year).

## 5. UserGuiding: most affordable no-code option

UserGuiding starts at $69/month for 1,000 MAU, making it the cheapest SaaS option on this list.

**Strengths:**
- Lowest SaaS entry price at $69/month
- Simple interface that doesn't require CSS knowledge for basic tours

**Limitations:**
- Analytics weaker than Userpilot or Pendo
- At 2,500 MAU the Professional plan hits $249/mo

**Pricing:** Basic: $69/mo (1,000 MAU). Professional: $249/mo (2,500 MAU). Corporate: custom.

## 6. Product Fruits: affordable mid-range SaaS

Product Fruits starts at $96/month for 1,500 MAU and offers tours, hints, checklists, surveys, a help widget, and changelogs.

**Strengths:**
- Competitive pricing at $96/month
- Feature set covers most onboarding needs without upsells

**Limitations:**
- Smaller user community and fewer integrations
- No accessibility documentation

**Pricing:** Starter: $96/mo (1,500 MAU). Growth: custom. Enterprise: custom.

## 7. Shepherd.js: best free library for non-React apps

Shepherd.js is an open-source tour library with around 13,000 GitHub stars. Framework-agnostic but requires AGPL licensing as of April 2026.

**Strengths:**
- Framework-agnostic: works with React, Vue, Angular, or vanilla JS
- Active maintenance and large community

**Limitations:**
- AGPL license requires you to open-source your code or purchase a commercial license
- ~25KB gzipped, 3x the size of Tour Kit's core
- Ships with opinionated CSS. No headless mode.

**Pricing:** $0 (AGPL open source). Commercial license available.

## 8. React Joyride: best for quick prototypes

React Joyride is the most downloaded React product tour library with over 603,000 weekly npm downloads. Ships with a complete default UI for fast prototyping.

**Strengths:**
- Largest React community for product tours
- Built-in UI means zero design work for prototypes

**Limitations:**
- 37KB gzipped, which is 4.6x larger than Tour Kit's core
- Inline styles conflict with Tailwind, shadcn/ui, and CSS-in-JS approaches
- Class-based architecture with only partial React 19 support

**Pricing:** $0 (MIT open source).

## How to choose

**Choose a headless library (Tour Kit)** if your team has React developers who want full design control, accessibility compliance, and no per-user pricing.

**Choose an opinionated library (React Joyride, Shepherd.js)** if you need a working tour fast and don't care about matching your design system.

**Choose a SaaS platform (Appcues, Userpilot, UserGuiding, Product Fruits)** if your product team needs to create and iterate on tours without filing tickets with engineering. Budget $3,000-$36,000/year depending on MAU scale.

Something none of these SaaS tools address: accessibility. We ran axe-core against every SaaS tour overlay on this list. All failed with missing ARIA attributes, broken focus management, and no keyboard navigation.

If your product has accessibility requirements (and it should), a library approach gives you the control to meet them.

Full article with FAQ section and detailed comparison: [usertourkit.com/blog/best-chameleon-alternatives](https://usertourkit.com/blog/best-chameleon-alternatives)
