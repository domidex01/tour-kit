## Thread (6 tweets)

**1/** Feature flag articles talk about release management. Product tour articles talk about tooltip placement. Nobody connects them.

Here's how to wire LaunchDarkly, GrowthBook, or PostHog flags into React tour step visibility:

**2/** The pattern: every major flag SDK uses a React Context provider + hook. Tour Kit uses the same model.

Compose them: FlagProvider wraps TourProvider. Each step's `when` prop reads a flag hook. Step skipped = no DOM mount, no render cycle.

**3/** Gotcha that cost us an hour: JavaScript treats the string "false" as truthy.

GrowthBook documented a real bug where a flag with value "false" (string) was enabling experimental UI for ALL users. Fix: typed flag map + TypeScript generics.

**4/** For Next.js: evaluate flags server-side in a Server Component, pass booleans to the client tour component.

Result: tour mounts with correct steps on first render. Zero flicker, zero CLS penalty, zero loading states.

**5/** We compared 5 flag SDKs for tour integration. Key differentiator: real-time streaming.

LaunchDarkly, GrowthBook, and Flagsmith push flag changes via SSE. Tours adapt mid-session. PostHog needs a page refresh.

**6/** Full guide with code examples, SDK comparison table, type-safe hook patterns, and A/B testing onboarding experiments:

https://usertourkit.com/blog/feature-flag-product-tour
