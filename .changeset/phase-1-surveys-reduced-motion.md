---
"@tour-kit/surveys": patch
---

Honor `prefers-reduced-motion: reduce` for `<SurveyModal>` and `<SurveySlideout>`. Every `tailwindcss-animate` utility on the modal + slideout content/overlay is now gated behind Tailwind's `motion-safe:` prefix in the cva variant files. Adds `modalContentVariants`, `modalOverlayVariants`, `slideoutContentVariants`, `slideoutOverlayVariants` to the public exports for consumer customization, and re-exports `useReducedMotion` from `@tour-kit/core` for ergonomic in-package access. No breaking API changes.
