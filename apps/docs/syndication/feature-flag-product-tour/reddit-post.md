## Subreddit: r/reactjs

**Title:** Pattern for connecting feature flags to product tour steps in React

**Body:**

I've been working on a pattern for wiring feature flag SDKs (LaunchDarkly, GrowthBook, Flagsmith, PostHog) into product tour step visibility, and wanted to share what I found.

The core idea: every major flag SDK uses a React Context provider + hook pattern. If your tour library also uses a provider, you compose them so that each tour step's visibility depends on the user's active flags. When a feature rolls out to 10% of users, the matching tour step only appears for that 10%. When they upgrade plans, new tour steps appear automatically.

One thing that caught me off guard: JavaScript treats the string `"false"` as truthy. GrowthBook actually documented a bug where a flag with value `"false"` (string, not boolean) was enabling experimental UI for all users. The fix is a typed flag map so TypeScript catches these at build time.

For Next.js apps, evaluating flags server-side and passing booleans as props to the client tour component eliminates the async flicker problem entirely. No loading states, no CLS penalty.

I also compared five flag SDKs specifically for tour integration. The key differentiator is real-time streaming: LaunchDarkly, GrowthBook, and Flagsmith push flag changes via SSE, so tours adapt mid-session. PostHog and others need a page refresh.

Full write-up with code examples, a provider comparison table, and an A/B testing pattern for onboarding experiments: https://usertourkit.com/blog/feature-flag-product-tour

Curious if anyone else has connected their flag provider to onboarding flows, or if you handle conditional tour steps differently.
