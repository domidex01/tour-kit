# How to sync your product tours with LaunchDarkly feature flags

## Your onboarding is lying to users behind feature gates. Here's how to fix it.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-launchdarkly-feature-flagged-onboarding)*

You shipped a new analytics dashboard behind a LaunchDarkly flag. It's rolling out to 10% of accounts this week. But your onboarding tour still walks every user through the old layout, pointing at elements that don't exist for 90% of them.

Feature flags gate which UI ships. Product tours should follow the same gates. The problem is that every LaunchDarkly tutorial stops at "toggle a button." Nobody shows the glue code between the flag evaluation and a tour engine that filters steps, swaps entire flows, or kills a broken tour in seconds without redeploying.

I built this integration using Tour Kit (a headless React tour library at under 8KB gzipped) and LaunchDarkly's React SDK (~998K weekly npm downloads as of April 2026). The pattern is a single custom hook that reads flag values and filters tour steps before they reach the tour engine.

## Why this pairing works

**Rollout rings propagate to tours automatically.** When you move a feature from 10% to 50% of users, the matching tour steps appear for that 50%. No tour configuration changes needed.

**Kill switches work on tours too.** LaunchDarkly's "kill switch" pattern disables a broken tour in seconds. Your new onboarding confused users? Kill it from the dashboard while you fix the copy. No deploy, no hotfix.

**Plan-tier targeting comes free.** LaunchDarkly evaluates user attributes like plan, role, and company size server-side, then streams results to the client SDK.

One limitation: Tour Kit requires React developers to write code. There's no visual builder where a product manager can drag tour steps onto a screen. This integration is code-first.

## The core pattern

The entire integration is a single custom hook. It calls LaunchDarkly's useFlags() hook, checks each tour step's associated flag key, and returns only the steps whose flags evaluate to true for the current user.

Each step can optionally declare a featureFlag property. Steps without one always appear. Steps with a flag appear only when that flag is truthy. A kill switch flag returns an empty array, making the tour component render nothing.

A user on the 10% rollout ring for a feature sees the matching onboarding step. Everyone else sees the tour without it. When the flag rolls out to 100%, the step appears automatically. No code change, no deploy.

## Going further

Once the basic integration works, three patterns add more value:

**Progressive rollout rings for tours.** Canary-test a new onboarding flow: 1% internal, then 5% canary, then 25% beta, then 100% GA. Apply the same rollout ring pattern you use for features to your tours.

**A/B testing tour variants.** Create a multivariate flag with string values like "tour-v1" and "tour-v2". Load different step arrays based on the flag value instead of filtering a single array.

**Analytics correlation.** Fire tour completion events alongside LaunchDarkly's flag evaluation data. The query you want: "Users who saw Tour V2 behind flag X had a 23% higher 7-day retention rate."

The full article with code examples, provider setup, testing patterns, and a comparison table of flag providers is at [usertourkit.com](https://usertourkit.com/blog/tour-kit-launchdarkly-feature-flagged-onboarding).

---

*Disclosure: I built Tour Kit. It doesn't have a visual builder or drag-and-drop editor. If you need no-code tour creation, LaunchDarkly pairs better with tools like Appcues or Pendo.*

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, Bits and Pieces
