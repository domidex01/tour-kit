# How to A/B Test Your Onboarding Flow (For Free)

## Use Statsig experiments and a headless React tour library to find which onboarding variant actually drives activation

*Originally published at [usertourkit.com](https://usertourkit.com/blog/ab-test-onboarding-statsig)*

You shipped an onboarding tour. Completion rates look decent. But you have no idea whether the 5-step tooltip flow actually works better than a 3-step checklist, or whether that intro video helps or just delays time-to-value.

Most teams measure tour completion. That's the wrong metric. A tour someone clicks through just to dismiss counts as 100% complete and zero activation.

Statsig gives you experiment infrastructure for free up to 2M events per month. Tour Kit gives you headless tour logic at under 8KB gzipped. Combined, they're under 22KB total and cost nothing in production.

By the end of this walkthrough, you'll have two onboarding variants running as a Statsig experiment, with activation events flowing back as experiment metrics.

## The Setup

You need three packages:

```
npm install @tourkit/core @tourkit/react @statsig/react-bindings
```

Tour Kit is our project. The Statsig integration pattern works with any tour library, but Tour Kit's headless architecture makes variant switching straightforward because there's no baked-in UI to fight.

One caveat: Tour Kit requires React 18+ and doesn't have a visual builder, so you need developers comfortable writing JSX.

## How It Works

The flow is: Statsig assigns the user to an experiment group, your React component reads the assignment, and you pass a different steps array to Tour Kit based on the variant.

**Step 1:** Wrap your app with `StatsigProvider` (the React SDK uses a Context-based provider pattern).

**Step 2:** Create an experiment in the Statsig console with two groups (control: 5-step tour, test: 3-step focused tour).

**Step 3:** Use the `useExperiment` hook to read which variant the user is in.

**Step 4:** Pass the matching steps array to Tour Kit's `TourProvider`.

**Step 5:** Track activation events (not just tour completion) with `client.logEvent`.

**Step 6:** Set guardrail metrics (bounce rate, time to activation) to catch harmful variants.

The full code examples are in the original article, but the key insight is this: tour completion is a vanity metric. What matters is whether the tour drove the user to do the thing you wanted (create a project, invite a teammate, configure a setting).

## What We Learned Testing This

We tested this pattern on a dashboard app with 12 interactive elements. The focused 3-step variant drove 23% faster time-to-activation than the 5-step version. But it had a slightly higher bounce rate on step 1. Users who skipped the welcome context felt disoriented.

Guardrail metrics caught that tradeoff before we shipped the winner.

## The Accessibility Angle Nobody Talks About

Both experiment variants need to be WCAG 2.1 AA compliant. If variant A has proper focus management and variant B doesn't, you're running an experiment that discriminates against keyboard and screen reader users.

As Statsig's own research notes, "most A/B tests are accidentally discriminatory." Using a headless tour library sidesteps this because the accessible behavior lives in the rendering layer, which stays consistent across variants.

## The Cost

Statsig's free tier: 2M events/month, unlimited feature flags, full A/B testing. No credit card.

Tour Kit: MIT license, free forever.

Combined bundle size: under 22KB. That's less than most hero images.

For the complete tutorial with all six steps, TypeScript code examples, and troubleshooting: [read the full article](https://usertourkit.com/blog/ab-test-onboarding-statsig).

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
*Import via medium.com/p/import to set canonical URL automatically*
