---
title: "Amplitude + Tour Kit: measuring onboarding impact on retention"
slug: "amplitude-tour-kit-onboarding-retention"
canonical: https://usertourkit.com/blog/amplitude-tour-kit-onboarding-retention
tags: react, javascript, web-development, analytics
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/amplitude-tour-kit-onboarding-retention)*

# Amplitude + Tour Kit: measuring onboarding impact on retention

Most teams track whether users finish their onboarding tour. Fewer teams ask the harder question: does finishing the tour actually change retention?

Amplitude's behavioral cohort model answers this directly. You split users into two groups (those who completed the tour within 24 hours of signup, and those who didn't) then compare their Day-7, Day-14, and Day-30 retention curves. The gap between those curves is the tour's real ROI.

Calm ran this exact analysis and found retention was [3x higher among users who completed a single onboarding step](https://amplitude.com/blog/user-onboarding-stack-retention) compared to those who skipped it.

This tutorial covers the full loop: install Tour Kit, instrument Amplitude events via typed callbacks, build step-level funnels, create behavioral cohorts, and run a retention analysis. About 70 lines of TypeScript.

Full article with all code examples: [usertourkit.com/blog/amplitude-tour-kit-onboarding-retention](https://usertourkit.com/blog/amplitude-tour-kit-onboarding-retention)
