# How to track whether your product tour actually works

## Wire React tour callbacks to PostHog for completion funnels and activation cohorts

*Originally published at [usertourkit.com](https://usertourkit.com/blog/track-product-tour-completion-posthog-events)*

You built a product tour. Users click through it. But how many finish? And does finishing actually correlate with activation?

Most product tour tools give you a completion percentage and call it analytics. That's a vanity metric. What you actually need to know: are users who complete the tour more likely to activate than users who skip it? And if so, which step is the biggest drop-off point?

This tutorial shows how to wire a headless React product tour (built with Tour Kit) to PostHog's `capture()` API. The result: step-level drop-off funnels, time-on-step tracking, and activation cohorts that let you compare tour completers vs skippers. About 60 lines of TypeScript.

## The key insight: map tour callbacks to PostHog events

Tour Kit's Tour interface exposes four lifecycle callbacks: `onStart`, `onComplete`, `onSkip`, and `onStepChange`. Each receives a context object with the current tour state. A wrapper function maps each callback to a `posthog.capture()` call with structured properties.

The five events you need:

- **tour started** — user begins the tour
- **tour step viewed** — user sees a step
- **tour step completed** — user advances past a step (includes time-on-step)
- **tour dismissed** — user exits early (includes completion percentage)
- **tour completed** — user finishes the tour (includes total time)

PostHog recommends the `[object] [verb]` naming convention, and these five events follow that pattern. Include more properties than you think you need — there's no limit per event, and you can't retroactively add properties to events that already fired.

## What you learn from the funnel

Industry benchmarks from Product Fruits put median 5-step tour completion at roughly 34%. Launcher-driven tours (where users opt in) hit around 67%.

But the raw completion number isn't the point. Build a funnel in PostHog (`tour started` → each `tour step viewed` → `tour completed`) and look at where the biggest drop happens. That's the step to rework.

Then build two cohorts: tour completers and tour skippers. Compare them against your activation metric. If tour completers activate at 3x the rate of skippers, the tour is working. If there's no difference, the tour might be teaching the wrong things.

## The full tutorial

The complete walkthrough — including PostHog provider setup, the `withPostHogTracking()` wrapper code, funnel building steps, cohort creation, and troubleshooting three common issues — is on the Tour Kit blog:

[Read the full tutorial with code examples](https://usertourkit.com/blog/track-product-tour-completion-posthog-events)

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
