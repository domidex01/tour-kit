---
"@tour-kit/analytics": minor
---

Remove two typed-but-dead public fields that promised behavior the runtime never delivered: `TourEvent.userProperties` (no production consumer) and `AnalyticsConfig.offlineQueue` (no offline-queue logic exists — the tracker batches only by `batchSize`).

`AnalyticsConfig.userProperties` is unchanged and remains wired: the tracker still passes it to each plugin's `identify()` on init. Pre-1.0, so this breaking type-surface change ships as a minor.
