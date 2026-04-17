# Session Replay for Onboarding: Finding Where Users Get Stuck

## How to see exactly why users abandon your product tour

*Originally published at [usertourkit.com](https://usertourkit.com/blog/session-replay-onboarding)*

Your onboarding funnel shows a 40% drop-off at step three. You know where users leave. You have no idea why. Perhaps the tooltip obscures the button they need to click. The form validation could be firing before they finish typing. Or the product tour skips a step on mobile viewports entirely.

Funnel charts can't answer any of those questions. Session replay can.

## The "what vs. why" gap

Funnel analytics tell you the conversion rate between step one and step two. They tell you that 23% of users abandon at the workspace creation screen. They don't tell you that users are trying to paste a URL into a text field that only accepts plain text.

Sprig's analytics team put it concisely: "Analytics tell you where users drop off. Session replay shows you why."

A practical workflow from PostHog's documentation: filter for sessions where your first onboarding event fired but the completion event didn't. Watching ten of these sessions per week typically reveals the same two or three friction points in over half of them.

## How it works

Session replay SDKs don't record video. They serialize DOM mutations into a structured event log that can be reconstructed in a sandboxed iframe. The dominant open-source implementation is rrweb, which both Sentry and several commercial tools fork internally.

The recording runs in three phases: initial DOM snapshot, incremental mutation capture via MutationObserver, and compressed upload to the server.

## Which tool to choose

The three features that matter most for onboarding analysis: funnel-to-replay linking, custom event filtering, and SDK bundle size.

PostHog (52.4 KB gzipped) is the strongest choice because it combines replay with funnel analytics in a single tool. Sentry (29-36 KB) is the lightest option. FullStory (58.8 KB) launched a free tier with 30,000 sessions per month in August 2025. Contentsquare (553 KB) is 15x larger than Sentry.

## The weekly workflow

Instead of watching replays randomly, use a structured weekly cadence:

**Monday:** Pull the funnel. Identify the step with the highest drop-off rate.

**Tuesday-Wednesday:** Watch 10 filtered sessions from that drop-off point. Tally friction patterns.

**Thursday:** Group patterns by frequency. The fix addressing 6 out of 10 failed sessions ships first.

**Friday:** Ship the fix. Tag it in analytics for before/after comparison.

Userpilot's research found that "watching 20 onboarding sessions tells you more than most quantitative analyses about where new users get stuck."

## Privacy matters

Session replay records user behavior. In GDPR jurisdictions, fines reach up to 20 million euros or 4% of annual global turnover. Modern replay SDKs ship "private by default" with automatic PII masking, but onboarding flows contain data that generic redaction misses: workspace names, team names, role selections.

Five rules: consent before recording, mask all onboarding inputs, block file upload previews, set 30-day retention limits, and disclose the replay vendor in your privacy policy.

## The open-source stack

For teams that want full data control: Tour Kit (MIT) for product tours, PostHog (MIT, self-hosted) for analytics and replay, rrweb (MIT) for custom recording, OpenReplay (open-source) as an alternative replay suite.

Everything runs on your infrastructure. No per-seat pricing. The tradeoff is operational overhead.

---

*Full article with code examples, comparison table, and implementation details at [usertourkit.com](https://usertourkit.com/blog/session-replay-onboarding).*

*Suggested Medium publications: JavaScript in Plain English, Better Programming, The Startup*
