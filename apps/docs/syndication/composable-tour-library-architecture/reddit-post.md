## Subreddit: r/reactjs

**Title:** I split a product tour library into 10 tree-shakeable packages. Here's the architecture.

**Body:**

I've been building Tour Kit, a headless product tour library for React, and one of the bigger decisions was splitting it into 10 separate npm packages instead of shipping one monolithic bundle.

The reason: React Joyride adds 37KB gzipped to your client bundle, and most projects use maybe 20% of that. Tour Kit's core is under 8KB. If you don't need surveys, analytics, or checklists, you don't download them.

The architecture follows a headless pattern. The core package has all the logic (step state machine, focus traps, keyboard navigation, position calculations). The React package wraps those hooks into components. Everything else (analytics, announcements, checklists, scheduling, surveys, media, hints, adoption) is optional.

The build uses Turborepo + tsup + pnpm workspaces. Each package outputs ESM + CJS with TypeScript declarations. Tree-shaking is enabled across the board, but we had to disable code splitting for two packages because tsup's splitting option caused duplicate chunks when re-exporting from dependencies.

Some things I'd do differently:

- Media embeds should have been part of announcements, not a separate package. Users almost always need both together.
- Bundle size budgets (core < 8KB, react < 12KB gzipped) are CI checks, not aspirations. Wish I'd set those from day one.
- We copy ~40 lines of shared utility code (cn, Slot, UnifiedSlot) into each package rather than creating a shared @tour-kit/utils. The duplication is deliberate.

I wrote the full walkthrough with dependency graphs, tsup configs, and the mistakes along the way: https://usertourkit.com/blog/composable-tour-library-architecture

Curious if anyone else has split a React library into multiple packages. What drove the decision, and what would you do differently?
