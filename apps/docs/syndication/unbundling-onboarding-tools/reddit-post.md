## Subreddit: r/reactjs (primary), r/SaaS (secondary)

**Title:** The unbundling of onboarding tools: why teams are ditching all-in-one platforms for composable stacks

**Body:**

I've been thinking about how onboarding tools are following the same unbundling pattern as the rest of the frontend stack. Nobody installs a monolithic UI framework anymore. You pick TanStack Router, Zustand, React Hook Form, shadcn/ui. Each piece is small and replaceable. But for onboarding, most teams are still buying one platform that ships tours, checklists, surveys, and analytics in a single 300KB bundle.

That's changing. Three things are pushing it:

1. **Performance is visible now.** WalkMe injects 180-350KB, Pendo adds 150-250KB. Core Web Vitals made that show up in search rankings.

2. **Lock-in is expensive.** Teams I've talked to estimate 3-6 months to migrate off Pendo because tour configs, analytics data, and targeting rules are all trapped in the platform.

3. **Teams already own most of the stack.** If you have PostHog + LaunchDarkly + shadcn/ui, the only missing piece is onboarding-specific logic (tour sequencing, step positioning, highlight rendering). That's what a composable library provides.

Deloitte found 46% of IT teams have already adopted composable architecture. The $39B+ modular software market is growing. Onboarding is just catching up to where frontend development was 5 years ago.

I wrote a longer piece with comparison tables (all-in-one vs composable cost/performance/lock-in) and code examples showing what a modular onboarding stack looks like in React: https://usertourkit.com/blog/unbundling-onboarding-tools

Disclosure: I built Tour Kit, which is a composable onboarding library, so I'm biased. But the trend data is independent of any single product. Curious if others are seeing this shift too.
