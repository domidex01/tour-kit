---
title: "Onboarding attribution: which tour actually drove the conversion?"
slug: "onboarding-attribution-tour-conversion"
canonical: https://usertourkit.com/blog/onboarding-attribution-tour-conversion
tags: react, javascript, web-development, analytics, saas
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-attribution-tour-conversion)*

# Onboarding attribution: which tour actually drove the conversion?

Your onboarding flow has five tours. A user completes three of them, skips two, then upgrades to paid on day nine. Which tour gets credit?

If you said "the last one they saw," you're using last-touch attribution, and you're probably wrong about what's working. As of April 2026, 95% of SaaS companies misattribute revenue by relying on single-touch models ([House of Martech](https://houseofmartech.com/blog/saas-marketing-attribution-multi-touch-models-that-actually-work)). And that stat is about marketing channels. Inside the product, attribution is practically nonexistent.

This guide breaks down how to attribute conversions to individual product tours using event-driven analytics.

## Why tour-level attribution matters

We measured tour-by-tour conversion impact across several onboarding flows and found something consistent: removing a single underperforming tour often had zero effect on conversion, while removing the one high-impact tour dropped trial-to-paid rates by 30-50%. Without tour-level attribution, you can't tell which is which.

## The six attribution models, applied to product tours

| Model | Credit split | Best for |
|---|---|---|
| First-touch | 100% to first | Understanding what starts activation |
| Last-touch | 100% to last | Understanding what closes activation |
| Linear | Equal across all | Balanced view when no clear winner |
| Time-decay | More to recent | Short trial cycles (7-day free trial) |
| U-shaped | 40 / 20 / 40 | B2B SaaS with long activation arcs |
| Data-driven | ML-weighted | Teams with 1,000+ conversions/month |

The U-shaped model gives 40% credit to the first touchpoint, 40% to the last, and distributes the remaining 20% across everything in between. For onboarding, this maps to: "Which tour got the user started?" and "Which tour sealed the deal?"

## Instrumenting tour-level attribution

The full article includes complete TypeScript code for:

1. Defining conversion events
2. Emitting tour events with attribution metadata via an analytics plugin
3. Building the attribution calculator (first-touch, last-touch, linear, U-shaped)
4. Connecting to PostHog, Mixpanel, or Amplitude
5. Implementing holdout groups to prove tours matter at all

**Full article with all code examples:** [usertourkit.com/blog/onboarding-attribution-tour-conversion](https://usertourkit.com/blog/onboarding-attribution-tour-conversion)
