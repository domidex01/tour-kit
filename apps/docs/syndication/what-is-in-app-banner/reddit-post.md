## Subreddit: r/reactjs

**Title:** TIL role="banner" is NOT for notification banners — it's a landmark role for the site header

**Body:**

I was building an announcement banner component and almost shipped `role="banner"` on it. Turns out that's completely wrong — `role="banner"` is the ARIA landmark role for identifying the site header (like `<header>`), not for notification-style banners.

For actual announcement banners you want:
- `role="alert"` for urgent stuff (downtime, security warnings) — screen readers announce it immediately
- `role="status"` for non-urgent announcements (new features, promos) — announced at idle

While researching this, I also put together a comparison of banners vs toasts vs modals since these get confused constantly:
- **Banner**: non-blocking, user dismisses manually, for persistent info
- **Toast**: non-blocking, auto-dismisses in 3-8 seconds, for action confirmations
- **Modal**: blocking with focus trap, for critical decisions

The other production concern is frequency control. A `useState(true)` banner that shows on every page load trains users to ignore it. Facebook's own research found that reducing notification volume improved long-term retention.

Full writeup with a React code example and a comparison table: https://usertourkit.com/blog/what-is-in-app-banner
