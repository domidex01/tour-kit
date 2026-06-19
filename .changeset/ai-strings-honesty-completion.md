---
"@tour-kit/ai": patch
---

Complete the `AiChatConfig.strings` honesty pass from 0.13.0 — every advertised
label now maps to a control the package actually renders.

- **Wired `send`** — the icon-only submit button in `AiChatInput` read a
  hard-coded `aria-label="Send message"`; it now reads `strings.send` (default
  unchanged), so `config.strings.send` finally applies.
- **Wired `emptyState`** — `AiChatPanel` defaulted its empty state to a literal
  that ignored `strings.emptyState`; the prop now falls back to
  `strings.emptyState` (an explicit prop still wins), so configuring it works.
- **Removed `retry`, `ratePositiveLabel`, `rateNegativeLabel`** from
  `AiChatStrings` — they labelled a retry/rating UI the package does not ship
  (no component, no `rate()` API, the `message_rated` event is never emitted).
  They rendered nothing, so removing them changes no runtime behavior;
  `AiChatStrings` is now exactly the seven labels the components render.

Also drops the residual "vector search" superlative from the README tagline and
funnels the provider's analytics events through one internal `emit()` helper (no
public API change).
