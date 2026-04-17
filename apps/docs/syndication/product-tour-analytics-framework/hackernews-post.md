## Title: Product Tour Analytics: A Two-Layer Measurement Framework (with benchmarks from 15M interactions)

## URL: https://usertourkit.com/blog/product-tour-analytics-framework

## Comment to post immediately after:

I built this measurement framework after realizing most product tour analytics stop at completion rate — which turns out to be a vanity metric if you're not connecting it to actual product outcomes.

The key insight: separate your analytics into two layers. Layer 1 is tour-level (completion, step drop-off, trigger-to-start rate). Layer 2 is product-level (activation, retention, feature adoption). Most teams only have Layer 1 and can't answer "did this tour actually change user behavior?"

Some benchmark data from Chameleon's 15M interaction dataset that I found interesting:
- Each step past three costs 15-20 percentage points in completion
- Self-serve tours outperform auto-triggered by 123%
- Progress indicators give +12% completion for essentially zero engineering effort

The article includes TypeScript code for routing tour events to your existing analytics stack (PostHog, Mixpanel, Amplitude) rather than locking them in a vendor dashboard. Full disclosure: I built Tour Kit, the library used in the examples, so the code is opinionated toward that approach.
