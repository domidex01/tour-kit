# What is an SDK? A plain-language guide for frontend developers

*How software development kits work, and why onboarding SDKs are replacing DIY tour code*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-an-sdk-onboarding)*

You've seen "SDK" on every developer tools landing page. The term gets thrown around loosely, sometimes meaning a full framework, sometimes just a couple of npm packages. When someone says "onboarding SDK," what exactly are they shipping to your users' browsers?

## What is an SDK?

An SDK (software development kit) is a packaged set of tools, libraries, type definitions, and documentation that developers use to build features for a specific platform or domain. Unlike a standalone library that solves one problem, an SDK bundles multiple related capabilities behind a cohesive API surface.

The Android SDK includes compilers, debuggers, emulators, and libraries, all coordinated to build Android apps from a single download. The term dates back to the 1980s, when platform vendors shipped physical media containing header files and sample code. Modern SDKs are distributed through package managers. You run `npm install` instead of inserting a CD-ROM.

What separates an SDK from a random collection of utilities is intentional design. The pieces work together. Types are shared across modules. Versioning is coordinated so you don't end up with incompatible sub-packages.

## How an SDK works

Most SDKs follow a layered pattern. A core layer handles state and domain logic. Adapter layers connect that core to specific frameworks. Optional extension packages add capabilities without bloating the base install.

In a React onboarding SDK like Tour Kit, the core package has zero framework dependencies. The React adapter wraps it in hooks and context. An analytics plugin is a separate install. You pick what you need, and the SDK tree-shakes away everything else.

## SDK vs API

An API is a contract: a set of endpoints or function signatures you can call. An SDK is a toolkit that includes an API along with everything else needed to use it productively. Red Hat's developer documentation puts it simply: "An API is the interface; an SDK is the workshop that contains tools to work with that interface."

Stripe is a good example. Stripe's REST API is the contract. Stripe's Node.js SDK (`@stripe/stripe-node`) is the toolkit that makes calling that API convenient, type-safe, and well-documented.

## Why SDKs matter for onboarding

The alternative to an onboarding SDK is building tour logic from scratch: element targeting, scroll-into-view behavior, positioning engine, step state machine, focus trapping, progress persistence. A simple 5-step tooltip tour takes roughly 40-60 hours of engineering time when built properly, according to Chameleon's build-vs-buy analysis.

An SDK compresses that to an afternoon. But not all onboarding SDKs are equal. The key questions: Does it tree-shake? Does it require React? Does it ship pre-styled components or let you render your own? Where does it store progress? Does it handle accessibility, or is that on you?

Tour Kit takes a modular approach with 10 separate packages, each under 12KB gzipped. It's React-only with no visual builder. For teams without React experience, a SaaS tool like Appcues or Userpilot might be faster, even at $300+/month.

Full article with code examples and comparison table: [usertourkit.com/blog/what-is-an-sdk-onboarding](https://usertourkit.com/blog/what-is-an-sdk-onboarding)

---

*Suggest submitting to: JavaScript in Plain English, Better Programming, or Bits and Pieces*
