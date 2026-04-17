*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-in-app-banner)*

# What Is a Banner? In-App Announcements and Feature Releases

## Your changelog got 40 views. In-app banners reach every active user.

You shipped a feature last Tuesday. Your changelog got 40 views. Your email announcement had a 19% open rate. Meanwhile, 100% of your active users loaded the dashboard today and saw nothing.

In-app banners fix that gap. They sit inside the application itself, not in an inbox.

## What is an in-app banner?

An in-app banner is a non-blocking UI element — typically a horizontal strip at the top or bottom of the viewport — that communicates information without interrupting the user's current task. Unlike modals, banners don't require interaction before the user can continue. Unlike toasts, they don't disappear on a timer.

Banners occupy a specific middle ground: visible enough to communicate, unobtrusive enough to ignore safely.

## Three concerns that matter in production

A production banner needs more than `useState(true)`.

**Visibility rules.** Show once ever, once per session, or N times total. Without frequency control, users see the same announcement on every page load. Facebook's own research confirmed that reducing notification volume improved long-term user retention (Smashing Magazine, 2026).

**Dismissal persistence.** Remember that a user closed the banner. `localStorage` for anonymous users, server-side storage for authenticated users across devices.

**Accessibility.** The gotcha: `role="banner"` is a landmark role for the site header, not a notification. Use `role="alert"` for urgent banners (downtime) or `role="status"` for non-urgent announcements (new features).

## Banners vs toasts vs modals

- **Banner** — Non-blocking, manual dismiss, best for persistent announcements
- **Toast** — Non-blocking, auto-dismisses in 3–8 seconds, best for action confirmations
- **Modal** — Blocking with focus trap, best for critical decisions and consent

The general rule: modal if the user must act, toast if confirming what they just did, banner if it should stay visible without interrupting.

## Why this matters for product teams

Email open rates average 20%. Push notifications get muted by ~60% of mobile users. In-app banners reach 100% of active users because they render where the user already is.

But overuse kills the signal. When every minor update gets a banner, users train themselves to dismiss without reading. Frequency control is the answer: one banner per feature release, one active banner at a time, display rules tied to user behavior.

## The code

Tour Kit's `@tour-kit/announcements` package ships an `AnnouncementBanner` component with built-in frequency control, dismissal persistence, and proper ARIA roles — under 4KB gzipped. It also includes a headless variant for full design control.

Full article with code examples, comparison tables, and FAQ: [usertourkit.com/blog/what-is-in-app-banner](https://usertourkit.com/blog/what-is-in-app-banner)

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Level Up Coding*
