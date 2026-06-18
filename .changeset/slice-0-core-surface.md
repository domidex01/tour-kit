---
"@tour-kit/core": patch
---

Remove the dead, barrel-private hand-rolled position engine (`calculatePosition`,
`calculatePositionWithCollision`, `wouldOverflow`, `getFallbackPlacements`,
`PositionResult`, `shiftPositionIntoViewport`) from `utils/position.ts`. These were
never exported from the package barrel (two existing barrel guards assert their
absence), so per the breaking-change policy this is a patch, not a breaking change —
the live RTL/placement helpers are untouched. Also corrects the in-dev diagnostic tip
URL to `usertourkit.com` and drops the stale `floating-ui` keyword (core has no
`@floating-ui` dependency).
