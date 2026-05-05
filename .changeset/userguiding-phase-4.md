---
'@tour-kit/media': minor
'@tour-kit/core': minor
'@tour-kit/react': minor
'@tour-kit/hints': minor
'@tour-kit/announcements': minor
'@tour-kit/surveys': minor
'@tour-kit/checklists': minor
---

UserGuiding parity Phase 4 — Media-step content primitive.

Ship `<MediaSlot>` in `@tour-kit/media` as the universal media dispatcher and
wire it as the standard rendering primitive for the `media?` field across all
five content consumer packages.

**`@tour-kit/media`**
- New: `<MediaSlot>` component, `MediaSlotProps`, `MediaSlotType`,
  `detectMediaSlotType`, and the `MEDIA_SLOT_PATTERNS` constant.
- Auto-detects YouTube / Vimeo / Loom / Wistia / native video / GIF / Lottie
  via URL pattern matching. Unknown URLs fall back to `<img>`.
- Honors `prefers-reduced-motion: reduce` for Lottie / GIF / NativeVideo
  autoplay (and iframe autoplay) via `useReducedMotion()` from `@tour-kit/core`.
- iframe load errors swap to a clickable "Watch on \[provider]" fallback card.

**`@tour-kit/core`**
- New: `TourStepMedia` interface (structural alias of `MediaSlotProps`,
  inlined to keep `core` at the bottom of the dep graph). `TourStep.media`
  added.

**`@tour-kit/react`**
- `<TourCard>` renders `<MediaSlot>` between header and content when
  `step.media` is set. Adds `@tour-kit/media` as a workspace dependency.

**`@tour-kit/hints`**
- `HintConfig.media?` added. `<Hint>` renders `<MediaSlot>` above the tooltip
  content. Adds `@tour-kit/media` as a workspace dependency.

**`@tour-kit/announcements`**
- `AnnouncementMedia.type` widened from `'image' | 'video' | 'lottie'` to
  the full `MediaSlotType` union (9 values incl. `'auto'`). The narrower
  legacy values stay assignable — non-breaking.
- `<AnnouncementContent>`, `<AnnouncementBanner>`, and `<AnnouncementToast>`
  now render `<MediaSlot>` instead of inlined per-type dispatch. Modal,
  slideout, and spotlight reach `MediaSlot` through `<AnnouncementContent>`.
- Adds `@tour-kit/media` as a workspace dependency.

**`@tour-kit/surveys`**
- `QuestionConfig.media?` added. New `<QuestionMedia question={...}>`
  helper renders `<MediaSlot>` above a question prompt. Adds `@tour-kit/media`
  as a workspace dependency.

**`@tour-kit/checklists`**
- `ChecklistTaskConfig.media?` added. `<ChecklistTask>` renders `<MediaSlot>`
  inside the task row, below the description. Adds `@tour-kit/media` as a
  workspace dependency.

**Tree-shaking** — verified via `scripts/verify-treeshake.sh`:
toast-only consumers don't statically include the heavy
`@lottiefiles/react-lottie-player` payload (it's loaded via dynamic `import()`
inside `lottie-player.tsx`). See `notes/phase-4-treeshake.md`.
