---
'@tour-kit/core': minor
'@tour-kit/react': minor
'@tour-kit/hints': minor
'@tour-kit/codemods': minor
---

target-as-ref + MultiTourKit compose-mode (Phase 5 of v2 package polish).

The `target` prop on `TourStep` and `HintConfig` now accepts a third shape —
a getter function `() => HTMLElement | null` — alongside the existing string
selector and `RefObject<HTMLElement | null>`. All runtime dereference paths
(use-step, use-element-position, wait-for-step-target, utils/dom, plus four
React card/overlay consumers and both hints components) route through a
single new `resolveTarget` resolver exported from `@tour-kit/core`. The
union widening is fully backwards-compatible — existing string selectors
keep working with no console warning, and the resolver is SSR-safe (returns
null when `document` is undefined instead of throwing).

`<MultiTourKitProvider>` compose-mode is now the documented default: the
JSDoc example puts every `<Tour>`, `<TourOverlay>`, `<TourCard>`, and `<App />`
as children of the provider, and `useTour()` resolves through the registry
from any depth. The provider's runtime behavior is unchanged.

A new best-effort jscodeshift codemod `--from target-to-ref` rewrites
`target="#foo"` to `target={fooRef}` when a matching `useRef` binding lives
in the same file. Ambiguous matches get a `TODO(tour-kit): target-to-ref`
comment instead of a destructive rewrite, and the transform is idempotent
under re-runs.

Docs page: `/docs/react/target-prop`.
