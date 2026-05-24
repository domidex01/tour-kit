---
"@tour-kit/adoption": patch
"@tour-kit/ai": patch
"@tour-kit/announcements": patch
"@tour-kit/checklists": patch
"@tour-kit/core": patch
"@tour-kit/hints": patch
"@tour-kit/media": patch
"@tour-kit/react": patch
"@tour-kit/surveys": patch
---

chore: move 7 runtime dependencies into the pnpm catalog

`@floating-ui/react`, `class-variance-authority`, `@radix-ui/react-slot`,
`@radix-ui/react-dialog`, `@mui/base`, `clsx`, `tailwind-merge` are now
resolved via `catalog:` in `pnpm-workspace.yaml`. No version changes; no
behavior changes. Cuts future bumps from a 9-file find-and-replace to a
one-line edit and prevents accidental drift.

Refs: audit R-3.
