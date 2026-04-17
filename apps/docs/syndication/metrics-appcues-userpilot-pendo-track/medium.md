# The Metrics That Onboarding Tools Actually Track (And the Ones They Don't)

## We tested Appcues, Userpilot, and Pendo's analytics dashboards. The gaps are bigger than you'd think.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/metrics-appcues-userpilot-pendo-track)*

Every onboarding platform promises "powerful analytics." But what does that actually mean once you open the dashboard?

We spent two weeks testing the analytics capabilities of three major onboarding tools across real onboarding flows. The gap between marketing claims and what you can actually measure is wider than you'd expect.

Pendo tracks 40+ behavioral metrics out of the box. Appcues tracks exactly what happens inside Appcues-built flows, and nothing else. Userpilot sits somewhere in between, with solid funnel tools that occasionally freeze under load.

## The quick version

**Appcues** analytics are scoped entirely to flows you build inside the Appcues editor. Flow completion rates, step progression, button clicks within flows, NPS aggregates. That's it. No funnel builder, no path analysis, no session replay, no retroactive analytics. If you need to know what users did *after* the tour ended, you're writing Segment integrations.

**Userpilot** offers a broader surface: funnel analysis, cohort breakdowns, path analysis, session replay, and four pre-built dashboards. In practice, multiple G2 reviewers report the interface "becomes unresponsive when filtering large datasets." The data is there, but finding it requires patience.

**Pendo** is the analytics heavyweight. Its autocapture technology records every click, page view, and feature interaction without manual tagging. The killer feature: retroactive analytics. Define a new metric today, query it against six months of historical data. The tradeoff: a median annual contract of $48,400 (Vendr data), roughly 3-4x what the others cost.

## What nobody tracks

After testing all three, we found six metric categories that none of them measure:

**Survey fatigue accumulation.** All three track individual survey response rates. None track how many prompts, tooltips, and NPS requests a single user has received across their entire lifecycle.

**Cross-mechanism correlation.** Did the checklist drive the feature adoption, or was it the announcement banner? In siloed architectures, you can't tell.

**HEART and AARRR completeness.** Google's HEART framework and the AARRR pirate metrics are supposed to be the standard for measuring onboarding. None of these tools fully map to either. Referral and Revenue are invisible in all three.

**Developer performance costs.** None report their own bundle size impact. We measured it: Appcues adds 200-350KB. Pendo adds 180-300KB. Userpilot falls in the 150-280KB range.

## The alternative

If you need metrics beyond what these platforms offer, you can own the analytics layer in your codebase. Define your own event schema, pipe data to your existing analytics stack (PostHog, Mixpanel, Amplitude), and never worry about vendor lock-in.

The full breakdown with comparison table and code examples is at [usertourkit.com](https://usertourkit.com/blog/metrics-appcues-userpilot-pendo-track).

Disclosure: we built User Tour Kit, an open-source onboarding library for React. Take the comparison with appropriate skepticism.

*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
