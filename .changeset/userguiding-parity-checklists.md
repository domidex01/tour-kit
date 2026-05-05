---
"@tour-kit/checklists": minor
---

Wire i18n, the `urlVisit` task type, and `<MediaSlot>` into checklists:

- Task `title`/`description` accept `LocalizedText` resolved against `<LocaleProvider>`.
- New `type: 'urlVisit'` task condition completes when the user navigates to a configured URL pattern.
- Optional `media` slot renders `<MediaSlot>` per task.

All additions are additive — no breaking changes.
