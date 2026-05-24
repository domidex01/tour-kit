---
'@tour-kit/announcements': patch
---

QA fixes surfaced by the dashboard-next example.

- `AnnouncementBanner` now defaults to `sticky: true`. Without an explicit
  `sticky` value the banner was rendering as a flow-positioned flex sibling,
  which in flex/grid layouts (like dashboard-next's `AnnouncementsHost`) ate
  ~728px of horizontal space and squeezed `<main>` from 1171px to 442px.
  Both the cva `defaultVariants` and the `effectiveSticky ?? true` fallback
  now agree on `true`; opt out with `sticky={false}` or
  `bannerOptions.sticky = false`.
- `AnnouncementModal` adds an explicit `aria-modal="true"` on
  `Dialog.Content` so screen readers can detect modality.
- `ScheduledBanner` (example) wraps its diagnostic body in a mount guard so
  the SSR/CSR diagnostic text no longer diverges (`not_registered` vs
  `wrong_time`).
