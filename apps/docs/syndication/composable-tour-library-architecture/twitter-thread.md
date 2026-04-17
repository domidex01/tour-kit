## Thread (7 tweets)

**1/** Most React tour libraries ship as one npm package. React Joyride? 37KB gzipped. Everything loaded whether you use it or not.

I split Tour Kit into 10 tree-shakeable packages. Here's why and how:

**2/** The core package is under 8KB gzipped. It has ALL the logic: step state machine, focus traps, keyboard navigation, position calculations. Zero UI. Zero CSS.

The React package wraps those hooks into components. Under 12KB.

Everything else? Optional.

**3/** The 10 packages map to user intents, not technical layers:

- Core + React + Hints (foundation, MIT)
- Analytics (5 plugins: PostHog, Mixpanel, Amplitude, GA4, console)
- Announcements, Surveys, Checklists, Media, Scheduling, Adoption

None depend on each other. All depend on core.

**4/** Tree-shaking isn't automatic. Tour Kit uses tsup with ESM output, sideEffects: false, and code splitting.

The gotcha: tsup's splitting option caused duplicate chunks when packages re-exported from dependencies. Had to disable it for 2 packages.

**5/** Bundle size budgets are CI checks, not aspirations:

- core < 8KB gzipped
- react < 12KB gzipped
- hints < 5KB gzipped

If a PR exceeds the budget, the build fails. Period.

**6/** What I'd do differently:

- Media should be part of announcements (users almost always need both)
- Copy small utilities instead of creating a shared @tour-kit/utils package
- Set bundle budgets from day one, not after the first bloat incident

**7/** Full deep-dive with dependency graphs, tsup config, Turborepo setup, and the architecture mistakes I made:

https://usertourkit.com/blog/composable-tour-library-architecture
