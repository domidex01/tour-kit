---
"@tour-kit/core": minor
---

Add UserGuiding parity primitives:

- **i18n** — `interpolate`, `LocaleProvider`, `useLocale`, `useT`, `useResolveLocalizedText` with `{{var | fallback}}` grammar, ICU-lite plurals, RTL auto-derivation, and a host-adapter `t` prop.
- **Segmentation** — `SegmentationProvider`, `useSegment`, `useSegments`, `useSegmentationContext`, `parseUserIdsFromCsv` (RFC 4180-lite, header-aware, dedup, BOM-safe).
- **Audience** — `AudienceProp = AudienceCondition[] | { segment: string }` (promoted from `@tour-kit/announcements`), `matchesAudience`, `validateConditions`.

All additions are additive — no breaking changes.
