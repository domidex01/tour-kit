---
"@tour-kit/react": minor
---

Wire i18n, audience, and `<MediaSlot>` into Tour steps:

- `TourStep` accepts `LocalizedText` titles/content that resolve through `<LocaleProvider>` + `useT`.
- `TourStep.audience` accepts `AudienceCondition[]` or `{ segment: 'name' }` (consumes `<SegmentationProvider>`).
- Optional `media` slot renders `<MediaSlot>` inside the step card.

All additions are additive — no breaking changes.
