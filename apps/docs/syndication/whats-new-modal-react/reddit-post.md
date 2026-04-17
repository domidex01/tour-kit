## Subreddit: r/reactjs

**Title:** I wrote up how to build a "What's New" changelog modal with native dialog, localStorage persistence, and analytics hooks

**Body:**

Most "What's New" modal tutorials stop at `useState` + a hardcoded list. Real implementations need per-entry seen/unseen tracking, frequency control (show once, N times, or on an interval), SSR hydration safety for Next.js, and some way to know which updates users actually read.

I put together a step-by-step tutorial that uses the native HTML `<dialog>` element instead of react-modal (which ships at 188KB). The `<dialog>` gives you focus trapping and ESC dismissal built in, plus `aria-modal="true"` for accessibility. The only thing you need to handle manually is returning focus to the trigger on close (a ref + `.focus()` call).

The approach uses a typed TypeScript data file for entries, a context provider for state/persistence, and lifecycle callbacks (`onView`, `onDismiss`, `onAction`) for analytics. Total implementation is about 80 lines across 3 files.

Key decisions in the tutorial:
- Stable entry IDs (like `v2-4-0-dark-mode`) instead of random UUIDs -- prevents the "modal keeps reappearing" bug
- localStorage with a `tour-kit:announcements:` key prefix for seen tracking
- `'use client'` boundary for the provider in Next.js App Router to avoid hydration mismatches

Full article with all code: https://tourkit.dev/blog/whats-new-modal-react

Built with Tour Kit's announcements package (I'm the author, so take the recommendation with appropriate skepticism). Happy to answer questions about the implementation choices.
