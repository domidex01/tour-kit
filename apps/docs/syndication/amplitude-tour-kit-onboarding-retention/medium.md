# Amplitude + Tour Kit: Measuring Onboarding Impact on Retention

## How to use behavioral cohorts to prove your product tour actually drives retention

*Originally published at [usertourkit.com](https://usertourkit.com/blog/amplitude-tour-kit-onboarding-retention)*

Most teams track whether users finish their onboarding tour. Fewer teams ask the harder question: does finishing the tour actually change retention?

Amplitude's behavioral cohort model answers this directly. You split users into two groups — those who completed the tour within 24 hours of signup, and those who didn't — then compare their Day-7, Day-14, and Day-30 retention curves. The gap between those curves is the tour's real ROI.

Calm ran this exact analysis and found retention was 3x higher among users who completed a single onboarding step compared to those who skipped it (source: Amplitude blog).

But Amplitude doesn't ship a product tour component. And most tour libraries don't ship typed analytics callbacks. Tour Kit bridges this gap: its onTourStart, onStepView, onTourComplete, and onTourSkip callbacks map directly to Amplitude events.

## The integration in 70 lines

The approach: wire Tour Kit's TourKitProvider callbacks to Amplitude's track() API with a typed event schema, build step-level funnels to find drop-off points, then create behavioral cohorts to compare retention between tour completers and skippers.

Key data points from the tutorial:

- Teams that redesign onboarding flows based on drop-off data see 20–25% improvements in trial-to-paid conversion
- Amplitude's free tier covers 50,000 MTUs/month
- The Amplitude browser SDK ships at roughly 36KB gzipped (vs. PostHog's 52KB)
- Tour Kit's core is under 8KB gzipped — the analytics SDK is the heavier dependency by 4.5x

## The behavioral cohort pattern

This is the part most analytics tutorials skip: creating three cohorts (completers, skippers, and unseen users) and comparing their retention curves. The "unseen" group is critical — it's your control. Comparing completers against skippers alone introduces selection bias.

Full tutorial with TypeScript code examples, funnel setup, and troubleshooting: [usertourkit.com/blog/amplitude-tour-kit-onboarding-retention](https://usertourkit.com/blog/amplitude-tour-kit-onboarding-retention)

---

*Suggest submitting to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium.*
