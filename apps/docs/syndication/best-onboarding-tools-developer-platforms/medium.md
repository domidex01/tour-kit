# The Developer Tool Onboarding Problem (and 8 Tools That Solve It)

## Most onboarding tools are built for the wrong audience. Here's what actually works for developer platforms.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-onboarding-tools-developer-platforms)*

Developer tools don't onboard like consumer SaaS. Your users read docs before they read tooltips. They want to see a code snippet, not a marketing video. They'll close a modal faster than they'll close a terminal window.

And yet most onboarding tools are built for product managers guiding non-technical users through form flows. If you're building a CLI, an API platform, a code editor plugin, or a developer dashboard, you need something different.

We tested eight tools by building the same three-step onboarding flow in a React 19 + TypeScript project: an API key setup, a first-request walkthrough, and a sandbox prompt.

*Full disclosure: Tour Kit is our project. We tested every tool on this list the same way. Every claim is verifiable against npm, GitHub, and bundlephobia.*

---

## What we measured

Six criteria that matter for developer platforms: bundle size, TypeScript support, React 19 compatibility, accessibility (WCAG 2.1 AA), developer-specific features, and pricing.

## The results, briefly

**Open-source libraries (free, you own the code):**

- **Tour Kit** ships at under 8 KB gzipped. Headless architecture means you render with your own components. WCAG 2.1 AA compliant. Best for teams with an existing design system.

- **Driver.js** is even smaller at 5 KB gzipped but only handles element highlighting. No React hooks, no multi-step state management.

- **Shepherd.js** is the most feature-complete OSS option at ~30 KB. Framework-agnostic with years of production usage. No first-party React hooks.

- **React Joyride** gives you a working tour in 30 minutes with pre-built UI. At 50 KB gzipped, it's the heaviest library option, and styling gets messy at scale.

**Platforms (monthly subscription, managed infrastructure):**

- **Frigade** targets developer-led companies with a code-first React SDK. Built-in analytics and targeting. Pricing requires contacting sales.

- **Appcues** ($300/month+) is the most recognized name. Visual builder, 20+ integrations, mobile SDKs. 200 KB+ SDK payload.

- **Userpilot** ($249/month+) bundles onboarding with product analytics and session replays. 250 KB+ SDK.

- **Chameleon** offers deeper CSS customization than competitors plus AI-powered agents. Custom pricing.

## The decision framework

Three questions matter:

**Who owns onboarding?** Developers? Pick a library. Product managers? Pick a platform.

**Does bundle size matter?** Tour Kit at under 8 KB won't affect your Lighthouse score. Appcues at 200 KB+ might, especially if you're already loading heavy editor components.

**Does onboarding need to match your design system?** Headless tools render with your components. Everything else requires CSS overrides or accepting someone else's UI.

Smashing Magazine documented how platformOS won an award by offering three parallel onboarding routes: non-technical, semi-technical, and technical. Developer platforms should think the same way.

---

The full article includes a detailed comparison table, code examples, pricing breakdown, and FAQ. Read it at usertourkit.com/blog/best-onboarding-tools-developer-platforms.

*Suggested Medium publications: JavaScript in Plain English, Bits and Pieces, The Startup*
