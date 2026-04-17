---
title: "What is an SDK? How onboarding SDKs work"
slug: "what-is-an-sdk-onboarding"
canonical: https://usertourkit.com/blog/what-is-an-sdk-onboarding
tags: react, javascript, web-development, sdk
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-an-sdk-onboarding)*

# What is an SDK? How onboarding SDKs work

You've seen "SDK" on every developer tools landing page. The term gets thrown around loosely, sometimes meaning a full framework, sometimes just a couple of npm packages. When someone says "onboarding SDK," what exactly are they shipping to your users' browsers?

```bash
npm install @tourkit/core @tourkit/react
```

This glossary entry defines the term precisely, explains how SDKs differ from APIs, and breaks down what an onboarding SDK actually does at the code level. We built [Tour Kit](https://usertourkit.com/) as a modular onboarding SDK, so we'll use it for concrete examples. The concepts apply to any SDK in this space.

## What is an SDK?

An SDK (software development kit) is a packaged set of tools, libraries, type definitions, and documentation that developers use to build features for a specific platform or domain. Unlike a standalone library that solves one problem, an SDK bundles multiple related capabilities behind a cohesive API surface. The Android SDK includes compilers, debuggers, emulators, and libraries, all coordinated to build Android apps from a single download ([Android Developers](https://developer.android.com/studio)).

The term dates back to the 1980s, when platform vendors shipped physical media containing header files and sample code. Modern SDKs are distributed through package managers. You run `npm install` instead of inserting a CD-ROM, but the concept hasn't changed: give developers everything they need to build on your platform in one coordinated package.

What separates an SDK from a random collection of utilities is intentional design. The pieces work together. Types are shared across modules. Versioning is coordinated so you don't end up with incompatible sub-packages.

## How an SDK works

Most SDKs follow a layered pattern. A core layer handles state and domain logic. Adapter layers connect that core to specific frameworks. Optional extension packages add capabilities without bloating the base install.

Here's what that looks like in practice with a React onboarding SDK:

```tsx
// Core layer: framework-agnostic logic
import { createTourConfig } from '@tourkit/core';

// Framework adapter: React bindings
import { TourProvider, useTour } from '@tourkit/react';

// Optional extension: analytics tracking
import { AnalyticsPlugin } from '@tourkit/analytics';

const config = createTourConfig({
  plugins: [AnalyticsPlugin({ provider: 'posthog' })],
});

function App() {
  return (
    <TourProvider config={config}>
      <YourApp />
    </TourProvider>
  );
}
```

The core package has zero framework dependencies. The React adapter wraps it in hooks and context. The analytics plugin is a separate install. You pick what you need.

## SDK vs API: what's the difference?

An API (application programming interface) is a contract: a set of endpoints or function signatures you can call. An SDK is a toolkit that includes an API along with everything else needed to use it productively. Red Hat's developer documentation puts it simply: "An API is the interface; an SDK is the workshop that contains tools to work with that interface" ([Red Hat](https://www.redhat.com/en/topics/api/what-is-an-sdk)).

| Aspect | API | SDK |
|---|---|---|
| What it is | A contract (endpoints, function signatures) | A toolkit (libraries, types, docs, examples) |
| Includes code? | No (you write the implementation) | Yes (pre-built implementations included) |
| Type safety | Manual (you define types from docs) | Built-in (types ship with the package) |
| Install size | Zero (it's a specification) | Varies (Tour Kit core is under 8KB gzipped) |
| Example | Stripe's REST API | Stripe's Node.js SDK (@stripe/stripe-node) |

## Onboarding SDK examples

An onboarding SDK packages the tools needed to guide users through your product: tour step sequencing, element highlighting, tooltip positioning, progress persistence, and analytics hooks.

```tsx
// src/components/WelcomeTour.tsx
import { useTour } from '@tourkit/react';

const steps = [
  { target: '#sidebar-nav', content: 'Navigate between sections here.' },
  { target: '#search-bar', content: 'Search across all your projects.' },
  { target: '#profile-menu', content: 'Manage your account settings.' },
];

export function WelcomeTour() {
  const { currentStep, next, back, isActive } = useTour({
    tourId: 'welcome',
    steps,
  });

  if (!isActive) return null;

  return (
    <div role="dialog" aria-label={`Step ${currentStep + 1} of ${steps.length}`}>
      <p>{steps[currentStep].content}</p>
      <button onClick={back} disabled={currentStep === 0}>Back</button>
      <button onClick={next}>
        {currentStep === steps.length - 1 ? 'Done' : 'Next'}
      </button>
    </div>
  );
}
```

Other onboarding SDKs include React Joyride (37KB gzipped, styled) and Shepherd.js (31KB gzipped, multi-framework). Driver.js takes a lighter approach at 5KB gzipped, vanilla JS only.

## Why SDKs matter for product onboarding

The alternative to an onboarding SDK is building tour logic from scratch. A simple 5-step tooltip tour takes roughly 40-60 hours of engineering time when built properly ([Chameleon](https://www.chameleon.io/blog/build-vs-buy)). An SDK compresses that to an afternoon.

Tour Kit's approach is modular: 10 separate packages, each under 12KB gzipped, MIT-licensed core with optional Pro extensions. That said, it's React-only and has no visual builder. For teams without React experience, a SaaS tool like Appcues or Userpilot might be a faster path, even at $300+/month.

## FAQ

### What does SDK stand for?

SDK stands for software development kit. It packages libraries, type definitions, and documentation so developers can build features for a specific platform without starting from scratch.

### Is an onboarding SDK the same as a product tour library?

Not exactly. A product tour library typically handles one thing: guided step-by-step tours. An onboarding SDK is broader. It may include tours, tooltips, checklists, announcements, and analytics under one coordinated package.

### Do onboarding SDKs affect page performance?

Every JavaScript dependency adds weight. A monolithic SDK can add 50-100KB to your bundle. A modular SDK like Tour Kit tree-shakes to under 8KB gzipped for the core. Google recommends keeping total JavaScript under 300KB for good Core Web Vitals scores ([web.dev](https://web.dev/performance/optimizing-javascript/)).

### Can I use an onboarding SDK with any frontend framework?

It depends on the SDK. Framework-agnostic options like Shepherd.js and Driver.js work with React, Vue, Svelte, or plain HTML. Framework-specific SDKs like Tour Kit and React Joyride require React 18+.
