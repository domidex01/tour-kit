---
"@tour-kit/surveys": minor
---

Wire i18n, thumbs/stars question types, and `<MediaSlot>` into surveys:

- Survey questions accept `LocalizedText` resolved against `<LocaleProvider>`.
- New `thumbs` and `stars` question types in addition to existing NPS / CSAT / CES.
- Optional `media` slot renders `<MediaSlot>` above the question stem.

All additions are additive — no breaking changes.
