---
"@tour-kit/checklists": minor
---

Remove two typed-but-dead fields: `ChecklistTaskState.active` (always `false` — the provider hardcoded it and no updater ever set it true) and `ChecklistProviderConfig.tourKitIntegration` (never read by the provider). The `{ type: 'tour' }` task action and its handler are unaffected. Pre-1.0, so this breaking type-surface change ships as a minor.
