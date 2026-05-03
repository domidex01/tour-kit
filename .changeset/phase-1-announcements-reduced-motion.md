---
"@tour-kit/announcements": patch
---

Honor `prefers-reduced-motion: reduce` across all five display variants (modal, slideout, banner, toast, spotlight). Every `tailwindcss-animate` utility (`animate-in`, `animate-out`, `fade-*`, `slide-in-from-*`, `slide-out-to-*`, `zoom-in-95`, `zoom-out-95`) is now gated behind Tailwind's `motion-safe:` prefix in the cva variant files and `<AnnouncementOverlay>`, so reduce-mode users never see them. Also re-exports `useReducedMotion` from `@tour-kit/core` for ergonomic in-package access. No public API changes.
