---
"@tour-kit/ai": minor
"@tour-kit/adoption": patch
---

`AiChatToggle` accepts a `style` prop merged over its fixed-position defaults,
so the launcher can be nudged away from other bottom-corner UI (framework dev
indicators, another FAB) without re-implementing it.

`AdoptionTable` rows no longer show a hover-background highlight by default —
the table is display-only (no row click handler) and the highlight read as
"clickable". Opt back in with the row variant's `hover` where rows are
genuinely interactive.
