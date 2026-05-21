---
'@tour-kit/react': minor
---

Refresh `<TourCard>` look (Phase 4 of v2 package polish).

The default `<TourCard />` now renders a step-of-N indicator inside the
header (visible decorative `<span aria-hidden="true">1 / 3</span>`), draws
a real Floating UI `<FloatingArrow>` that points at the target across all
12 placements, and gives the primary `Next` button a stronger
`focus-visible:ring-2` focus ring. The dialog now uses
`aria-label="Step N of M: <title>"` as its single screen-reader source —
the old `aria-labelledby` is removed and no `aria-live` region duplicates
the announcement.

Backwards-compatibility escape hatch: `<TourCard variant="classic" />`
pins the v1 layout (no step indicator, no arrow, current shipped Skip /
Back / Next variants) for one minor cycle. It emits a one-time
`console.warn` per `currentStep.id` in development; suppressed in
production. Removed in the next major.

New optional props on `TourCardProps`:

- `showStepIndicator?: boolean` — force the indicator on or off
  (defaults to `true` on `'refreshed'`, `false` on `'classic'`)
- `progress?: number` — override the `0..1` progress value
- `arrowSize?: number` — `<FloatingArrow>` height in px (default `8`,
  width is `2 × size`)
- `variant?: 'refreshed' | 'classic'` — opt-out, defaults to `'refreshed'`

`<TourArrow>` gains a `size?: number` prop and an explicit
`aria-hidden="true"`. The Skip button carries a constant
`aria-label="Skip tour"` so screen-reader naming is stable across i18n
even when `skipLabel` is customized.

Coverage: 11 a11y cases (8 existing + 3 new), 5 classic-variant cases,
and a 12-placement Playwright matrix that asserts arrow tips land within
4px of the target's edge.
