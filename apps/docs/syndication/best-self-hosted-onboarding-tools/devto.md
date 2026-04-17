---
title: "8 Self-Hosted Onboarding Tools That Keep User Data in Your Jurisdiction (2026)"
published: false
description: "We tested 8 self-hosted onboarding tools for GDPR compliance and data sovereignty. Client-side libraries vs Docker platforms — with bundle sizes, licensing, and accessibility compared."
tags: react, javascript, webdev, opensource
canonical_url: https://usertourkit.com/blog/best-self-hosted-onboarding-tools
cover_image: https://usertourkit.com/og-images/best-self-hosted-onboarding-tools.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-self-hosted-onboarding-tools)*

# 8 best self-hosted onboarding tools in 2026

Every SaaS onboarding tool you've heard of sends user behavior data to someone else's servers. Step completions, click coordinates, session recordings, feature adoption metrics. That data lands in AWS us-east-1 or GCP us-central1 by default, regardless of where your users are.

For EU companies operating under GDPR, NIS2, and DORA, that's not just a compliance checkbox. Meta paid EUR 1.2 billion in May 2023 for transferring EU user data to the US. Uber got fined EUR 290 million in August 2024 for the same thing. And in June 2025, Microsoft's own legal director told the French Parliament that Microsoft "cannot guarantee" EU data protection from US government access ([Akave, 2026](https://akave.com/blog/the-2026-data-sovereignty-reckoning)).

Self-hosted onboarding tools solve this. Some are client-side libraries where no data ever leaves the browser. Others are Docker-deployable platforms you run on your own infrastructure. Both keep onboarding data inside your jurisdiction.

```bash
npm install @tourkit/core @tourkit/react
```

## How we evaluated these tools

We installed each library into a Vite 6 + React 19 + TypeScript 5.7 project and built a 5-step onboarding tour. For platforms, we deployed via Docker on a Hetzner VPS in Frankfurt (eu-central). Scoring criteria: data residency guarantees, license compatibility with commercial use, accessibility support, bundle size (libraries) or resource footprint (platforms), and React 19 compatibility.

The market splits into two categories. Client-side libraries (npm packages) are inherently self-hosted because no user data ever hits a remote server. Platforms (Docker-deployable) add visual builders and analytics but require server infrastructure. We tested both.

**Bias disclosure:** We built Tour Kit, so it's listed first. Take our #1 ranking with appropriate skepticism. Every claim below is verifiable against npm, GitHub, and bundlephobia.

## Quick comparison table

| Tool | Type | License | Data leaves browser | Visual builder | React 19 | Accessibility | Best for |
|------|------|---------|---------------------|----------------|----------|---------------|----------|
| Tour Kit | Library | MIT (core) | Never | No (headless) | Yes | WCAG 2.1 AA | React teams with custom design systems |
| Shepherd.js | Library | MIT | Never | No | Wrapper | Keyboard + ARIA | Framework-agnostic projects |
| Driver.js | Library | MIT | Never | No | Vanilla | Minimal | Minimal footprint, zero dependencies |
| React Joyride | Library | MIT | Never | No | Yes | Minimal | Quick tours without design system needs |
| Intro.js | Library | AGPL / Commercial | Never | No | Wrapper | Minimal | Non-commercial projects only |
| Usertour | Platform | Open source | To your server | Yes | SDK | Unknown | Product teams wanting visual builders |
| Shepherd Pro | Platform | Open source | To your server | Yes | SDK | Partial | Teams already using Shepherd.js |
| Guidefox | Platform | Open source | To your server | Yes | SDK | Unknown | Early-stage teams wanting free analytics |

## 1. Tour Kit — best for React teams with design systems

Tour Kit is a headless onboarding library for React that ships logic without prescribing UI. The core package is under 8KB gzipped with zero runtime dependencies. With 10 composable packages (tours, hints, checklists, surveys, announcements, scheduling, adoption tracking, analytics, media), you install only what you need and render everything with your own components.

Because Tour Kit runs entirely client-side, no onboarding data ever leaves the browser. There's no server to configure, no Docker to deploy, no data pipeline to audit. For GDPR compliance, this is the simplest architecture: data that never exists on a server can't be transferred to a third country.

**Strengths:**
- Headless architecture with `asChild` composition, works with shadcn/ui, Radix, Tailwind, or any design system
- 10-package ecosystem covering tours, checklists, surveys, hints, announcements, adoption tracking, scheduling, media, and analytics
- WCAG 2.1 AA accessibility built in: focus management, keyboard navigation, `prefers-reduced-motion`, Lighthouse 100
- TypeScript-first with strict mode and full type exports

**Limitations:**
- No visual builder. You need React developers to create and modify tours
- Younger project with a smaller community than Shepherd.js or React Joyride
- React 18+ only. No support for older React versions or other frameworks
- No mobile SDK or React Native support

**Pricing:** Free and open source (MIT) for core packages. Pro packages available for $99 one-time.

**Best for:** React teams running Tailwind or shadcn/ui who need full design control and can't send user behavior data to third-party servers.

## 2. Shepherd.js — best framework-agnostic option

Shepherd.js is a mature, framework-agnostic tour library with the strongest accessibility story among traditional libraries. Built-in keyboard navigation, focus trapping, and ARIA attributes set it apart from libraries that treat accessibility as an afterthought. As of April 2026, Shepherd.js has over 12K GitHub stars and active maintenance.

The library works with vanilla JS, React, Vue, Angular, and Ember through framework-specific wrappers. That flexibility comes at a cost: the React wrapper adds an abstraction layer you wouldn't need with a React-native library.

**Strengths:**
- Framework-agnostic with official wrappers for React, Vue, Angular, and Ember
- Strongest accessibility among non-headless libraries: keyboard nav, focus trapping, ARIA roles
- Active maintenance with regular releases
- MIT license, no licensing traps

**Limitations:**
- React wrapper adds indirection. Not as idiomatic as React-native libraries
- Ships with opinionated UI. Restyling requires overriding CSS classes
- No built-in checklists, surveys, or adoption tracking. Tours only

**Pricing:** Free and open source (MIT).

**Best for:** Multi-framework teams that need a single tour library across their stack, or projects where accessibility is a hard requirement and React-specific solutions feel too narrow.

## 3. Driver.js — best for minimal footprint

Driver.js is the smallest tour library in this list. Zero dependencies, vanilla JavaScript, and a bundle that barely registers in your performance budget. It highlights elements on the page and walks users through steps. Nothing more.

That simplicity is the point. If you need a 3-step product tour and don't want to think about it, Driver.js gets the job done in under 50 lines of code.

**Strengths:**
- Smallest bundle size among popular tour libraries
- Zero dependencies
- Simple API. Configuration object in, tour out
- MIT license

**Limitations:**
- Vanilla JS only. React usage requires manual lifecycle management or a community wrapper
- No keyboard navigation or focus management out of the box
- No TypeScript-first design (types available but not strict)
- Tours only. No checklists, hints, or analytics

**Pricing:** Free and open source (MIT).

**Best for:** Projects that need a quick element highlighter without pulling in a full tour framework. Not ideal if you need React integration or accessibility compliance.

## 4. React Joyride — best for rapid prototyping

React Joyride is the most downloaded React-specific tour library, with over 600K weekly npm downloads as of April 2026. It uses a configuration-driven approach: you define steps as an array of objects, pass them to a component, and get a working tour.

The tradeoff is styling. React Joyride uses inline styles throughout. If your team runs Tailwind or a design system with tokens, you'll spend more time fighting the default styles than building the tour. Custom class names aren't supported unless you replace the entire tooltip component.

**Strengths:**
- Largest React community. Most Stack Overflow answers and blog tutorials
- Configuration-driven API. Working tour in under 30 lines
- Native React component. No wrapper layer
- MIT license

**Limitations:**
- Inline styles only. No className support without replacing default components
- Minimal accessibility. No focus management or keyboard navigation
- Last major architecture update was pre-React 18 hooks era
- Tours only. No broader onboarding ecosystem

**Pricing:** Free and open source (MIT).

**Best for:** Teams that need a working tour in an hour and don't care about matching their design system. Good for prototypes and MVPs. Harder to maintain in production design systems.

## 5. Intro.js — watch the license

Intro.js is one of the oldest product tour libraries, first released in 2013. It's mature, well-documented, and broadly compatible. But the license is the first thing you need to know: Intro.js uses AGPL, which requires you to open-source any application that includes it. Commercial use requires a paid license.

For EU companies evaluating self-hosted tools for compliance reasons, the AGPL license creates its own compliance burden. AGPL forces source disclosure, which can conflict with enterprise IP policies and some regulatory frameworks.

**Strengths:**
- Mature and stable. Over a decade of production use
- Broad browser support including older browsers
- Extensive documentation and examples
- Supports both tours and feature introduction hints

**Limitations:**
- AGPL license. Commercial use requires a paid license ($9.99/developer/month)
- No React-native component. Wrapper only
- Minimal accessibility features
- No TypeScript-first design

**Pricing:** Free for open source (AGPL). Commercial license at $9.99/developer/month.

**Best for:** Non-commercial open source projects that can comply with AGPL. Not recommended for commercial EU applications where source disclosure conflicts with IP or compliance requirements.

## 6. Usertour — best self-hosted platform with a visual builder

Usertour is an open source onboarding platform you deploy via Docker. It includes a visual flow builder, user targeting, analytics, and a React SDK. For product teams that want to create and iterate on tours without shipping code changes, this is the closest thing to an Appcues or Userpilot you can run on your own servers ([Usertour Blog, 2026](https://www.usertour.io/blog/open-source-onboarding-tools-2026)).

The tradeoff: you're running a server. Data stays in your infrastructure, but it does leave the browser and hits your backend. For GDPR, that means you need data processing documentation for the onboarding data your server stores.

**Strengths:**
- Visual flow builder for non-developers
- User targeting and segmentation
- Built-in analytics dashboard
- Docker deployment with full data control

**Limitations:**
- Requires server infrastructure (Docker, database, storage)
- Data leaves the browser to your server. You're the data processor now
- Newer project. Community and ecosystem still growing
- Accessibility documentation is sparse

**Pricing:** Free and open source. Self-hosted only.

**Best for:** Product teams that need a visual builder and analytics but can't use SaaS tools due to data residency requirements. You'll need DevOps capacity to run the Docker deployment.

## 7. Shepherd Pro — best for teams already using Shepherd.js

Shepherd Pro builds on the Shepherd.js open source library and adds a platform layer: visual editor, analytics, event tracking, and a management dashboard. If your team already uses Shepherd.js for tours, Shepherd Pro extends it without replacing your existing implementation.

It deploys via Docker or runs as a managed SaaS. The self-hosted Docker option gives you full data control with the same visual editing features as the cloud version.

**Strengths:**
- Builds on top of Shepherd.js. Existing tours work as-is
- Visual editor for creating and editing tours
- Analytics and event tracking
- Both SaaS and self-hosted Docker options

**Limitations:**
- Tied to Shepherd.js ecosystem. Not a general-purpose onboarding platform
- Self-hosted Docker deployment requires maintenance
- Accessibility inherits Shepherd.js strengths but platform layer has gaps
- Pricing for commercial features not publicly documented

**Pricing:** Open source core. Commercial features pricing available on request.

**Best for:** Teams already invested in Shepherd.js that want visual editing and analytics without migrating to a different library.

## 8. Guidefox — best for early-stage teams wanting free analytics

Guidefox is an open source onboarding platform with a visual UI builder, analytics, and Docker deployment. It targets teams that want Appcues-like features without Appcues pricing. The project is actively developed and positions itself as the "open source alternative to commercial DAPs" ([Userpilot, 2026](https://userpilot.com/blog/open-source-user-onboarding/)).

Still early-stage. The community is small, documentation is growing, and some features are in active development. But for teams willing to contribute or tolerate rough edges, the feature set per dollar is hard to beat.

**Strengths:**
- Visual onboarding builder with banner, popup, and tour support
- Built-in analytics for onboarding completion tracking
- Docker self-hosted. Full data control
- Completely free and open source

**Limitations:**
- Early stage. Smaller community and less battle-tested
- Accessibility features are undocumented
- React SDK available but limited compared to dedicated libraries
- Documentation gaps in advanced features

**Pricing:** Free and open source.

**Best for:** Startups and early-stage teams that want a free, self-hosted Appcues alternative and don't mind an early-stage project.

## How to choose the right self-hosted onboarding tool

The decision starts with who creates onboarding flows. If your product team needs a visual builder and you have DevOps capacity, pick a platform (Usertour, Shepherd Pro, Guidefox). If developers own onboarding and you want code-level control, pick a library.

**Choose a client-side library** if data sovereignty is your primary concern. Libraries like Tour Kit, Shepherd.js, and Driver.js run entirely in the browser. No server, no data pipeline, no GDPR data processing documentation for onboarding analytics. This is the simplest compliance architecture.

**Choose Tour Kit** if your team uses React with Tailwind or shadcn/ui and needs more than just tours. The 10-package ecosystem handles checklists, surveys, announcements, and adoption tracking without adding a server.

**Choose Shepherd.js** if you need a single tour library across React, Vue, and Angular, or if accessibility compliance is a hard requirement beyond what you want to build yourself.

**Choose a self-hosted platform** if non-developers need to create tours. You'll trade simplicity for features: visual builders, targeting, analytics. Just remember that "self-hosted" doesn't mean "no GDPR obligations." You're the data controller and processor.

**Choose React Joyride** if you need a working tour in an hour for a prototype or MVP. But plan to migrate if you later need design system integration or accessibility.

## Why data sovereignty matters for onboarding tools

Client-side onboarding libraries are a category that most data sovereignty discussions miss. When your tour library runs entirely in the browser, user interaction data (which steps they completed, what they clicked, where they dropped off) never hits any server. There's nothing to transfer, nothing to audit, nothing for the US CLOUD Act to compel ([Kiteworks, 2026](https://www.kiteworks.com/gdpr-compliance/understand-and-adhere-to-gdpr-data-residency-requirements/)).

As of April 2026, four EU regulations directly impact how SaaS tools handle user data: GDPR (active since 2018), DORA (active since January 2025, violations up to EUR 10 million), NIS2 (enforcement active 2026), and the EU Data Act (effective September 2025). US hyperscalers control approximately 70% of the European cloud market, and the structural conflict between the US CLOUD Act and EU data protection law remains unresolved ([Simplyblock, 2026](https://simplyblock.io/blog/achieving-data-sovereignty-in-2026/)).

For onboarding specifically, the data at risk is behavioral: which features users explored, which steps they skipped, how long they spent on each screen. That's personal data under GDPR Article 4. A client-side library eliminates this category of risk entirely.

## FAQ

### What is the best self-hosted onboarding tool in 2026?

Tour Kit is the best self-hosted onboarding tool for React teams that need design system integration and data sovereignty. It runs entirely client-side, so no user data ever leaves the browser. For teams needing a visual builder, Usertour is the strongest self-hosted platform option, deployable via Docker on your own infrastructure.

### Are client-side libraries really "self-hosted"?

Client-side JavaScript libraries are the most self-hosted option available. The code runs in the user's browser with no external server calls. No data leaves the browser, no backend to deploy, no infrastructure to maintain. For GDPR data sovereignty, this is architecturally superior to server-based self-hosting because there's no data processing to document.

### Do I need a self-hosted onboarding tool for GDPR compliance?

Not necessarily, but it simplifies compliance significantly. SaaS onboarding tools that process EU user data in US data centers face transfer mechanism requirements (Standard Contractual Clauses, adequacy decisions) and ongoing legal uncertainty. Self-hosted tools, especially client-side libraries, eliminate cross-border transfer risk entirely.

### Can I use Intro.js for a commercial SaaS product?

Not without a commercial license. Intro.js uses the AGPL license, which requires you to open-source your entire application if you distribute it. Commercial SaaS teams must purchase a license at $9.99/developer/month. For EU companies where source disclosure conflicts with IP policies, consider MIT-licensed alternatives like Tour Kit or Shepherd.js.

### What's the difference between a self-hosted library and a self-hosted platform?

Libraries (Tour Kit, Shepherd.js, Driver.js) are npm packages that run in the browser with zero server infrastructure. Platforms (Usertour, Shepherd Pro, Guidefox) are Docker-deployable applications with visual builders and analytics. Libraries need developers to modify tours. Platforms let product teams iterate without code but need DevOps support.
