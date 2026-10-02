---
'@tour-kit/core': minor
'@tour-kit/react': minor
'@tour-kit/hints': minor
'@tour-kit/adoption': minor
'@tour-kit/announcements': minor
'@tour-kit/checklists': minor
'@tour-kit/scheduling': patch
'@tour-kit/surveys': minor
'@tour-kit/vue': minor
'@tour-kit/svelte': minor
'@tour-kit/analytics': patch
'@tour-kit/ai': patch
'@tour-kit/media': patch
---

Tour Kit is MIT. Every package now ships under the MIT licence with no licence
gate, no "Unlicensed" badge and no network call to Polar, and none of them
depends on `@tour-kit/license` any more.

You don't need to change anything: a fresh install inside your existing `^`
range picks this version up and the badge is gone.

- `<ScheduleGate>` from `@tour-kit/scheduling` still exists but is deprecated.
  It renders its children unchanged.
- The `license` option on `provideTourKit()` / `<TourProvider>` in
  `@tour-kit/vue` and `@tour-kit/svelte` is deprecated and ignored.
- Versions already published under BUSL-1.1 keep that licence. Upgrading moves
  you to MIT.
