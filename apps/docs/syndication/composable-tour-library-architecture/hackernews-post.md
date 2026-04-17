## Title: The architecture of a 10-package composable React tour library

## URL: https://usertourkit.com/blog/composable-tour-library-architecture

## Comment to post immediately after:

I built Tour Kit, a headless product tour library for React, and wrote up the architecture behind its 10-package composable design.

The core problem: most tour libraries ship as one monolithic bundle (React Joyride is 37KB gzipped). If you only need step sequencing and a tooltip, you're still downloading analytics, scheduling, and survey code.

Tour Kit splits into 10 packages with explicit bundle budgets enforced as CI checks: core < 8KB, react < 12KB, hints < 5KB gzipped. Each package maps to a user intent (analytics, checklists, surveys, etc.) rather than a technical layer (hooks, components, utils).

The build pipeline uses Turborepo + tsup + pnpm workspaces. Some things that went wrong: tsup's code splitting caused duplicate chunks when packages re-exported from dependencies, and the media package probably should have been merged with announcements.

The article covers the dependency graph, tree-shaking configuration, accessibility centralization across packages, and common mistakes when splitting a library into multiple npm packages.
