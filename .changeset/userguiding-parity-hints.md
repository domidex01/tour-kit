---
"@tour-kit/hints": minor
---

Wire i18n, audience, frequency rules, and `<MediaSlot>` into hints:

- `HintConfig` accepts localized labels/content via `<LocaleProvider>`.
- `HintConfig.audience` accepts `AudienceCondition[]` or `{ segment: 'name' }`.
- Promoted `FrequencyRule` to a public type for cross-package reuse.
- Optional `media` slot renders `<MediaSlot>` inside hint cards.

All additions are additive — no breaking changes.
