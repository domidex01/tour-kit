# How to Build a "What's New" Changelog Modal in React

## localStorage persistence, seen/unseen tracking, and analytics in under 80 lines

*Originally published at [tourkit.dev](https://tourkit.dev/blog/whats-new-modal-react)*

Users don't read changelogs. Not the ones on your marketing site, and definitely not the ones buried in a GitHub releases page. In-product announcements consistently outperform external channels because they appear where users are already working. The industry has shifted from tracking open rates to measuring 7-day feature adoption rate -- a thousand impressions mean nothing if nobody tries the feature.

The typical React approach is a `useState` toggle, a hardcoded list, and a styled div. That covers about 30% of what you actually need. The rest -- localStorage persistence, per-entry seen tracking, focus trapping, frequency rules, analytics -- is where homegrown solutions quietly accumulate tech debt.

This tutorial walks through building a production-ready changelog modal using Tour Kit's announcements package. The implementation runs under 80 lines across 3 files and adds roughly 4KB gzipped to your bundle.

---

## The setup

You need three pieces: a typed data file for changelog entries, a provider for state management, and the modal component itself.

The data file uses a TypeScript interface with stable IDs (like `v2-4-0-dark-mode`) that Tour Kit uses for localStorage tracking. The provider wraps your app and manages which entries are visible, whether users have seen them, and how often they reappear. The modal uses the native HTML `<dialog>` element -- which gives you focus trapping and ESC-key dismissal for free, saving you from pulling in react-modal (188KB).

---

## Why native `<dialog>` over a library?

The W3C ARIA Authoring Practices Guide specifies that modals need `aria-modal="true"`, focus trapping, and focus return on close. The native `<dialog>` element handles the first two out of the box. You just need a ref to store `document.activeElement` before opening, then call `.focus()` on close.

As of April 2026, `<dialog>` has 97%+ global browser support. That's zero additional JavaScript versus 188KB for react-modal.

---

## DIY vs. library: where the 80% hides

You can build a basic modal with `useState`, `useEffect`, and `localStorage.getItem` in about 30 lines. Here's what you'd still need to build:

- **Frequency control** (show once, N times, or on an interval) -- timestamp math and a scheduler
- **Per-entry seen tracking** -- custom JSON parsing in localStorage
- **SSR hydration safety** -- a `hasMounted` guard for Next.js
- **Analytics hooks** -- custom event wiring for each entry
- **Multiple display variants** -- separate components for modal, toast, banner

Tour Kit handles all of these. You write the JSX; it manages the lifecycle.

---

## The honest tradeoffs

Tour Kit requires React 18+ and doesn't have a visual builder. If your team needs drag-and-drop changelog editing without writing code, a SaaS tool like LaunchNotes or Featurebase is a better fit. But if you want in-app announcements that match your design system exactly, a headless library gives you that control.

---

Read the full tutorial with all code examples, troubleshooting, and Next.js setup: [tourkit.dev/blog/whats-new-modal-react](https://tourkit.dev/blog/whats-new-modal-react)

**Suggested Medium publications:** JavaScript in Plain English, Bits and Pieces, Better Programming
