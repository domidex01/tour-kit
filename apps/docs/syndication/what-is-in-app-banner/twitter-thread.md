## Thread (6 tweets)

**1/** Your changelog got 40 views. Your email had a 19% open rate. 100% of your active users loaded the dashboard and saw nothing.

In-app banners fix that gap. Here's what most devs get wrong about them:

**2/** The #1 accessibility mistake: using `role="banner"` on announcement banners.

role="banner" is a landmark role for the SITE HEADER.

For notifications, use:
- role="alert" → urgent (downtime, security)
- role="status" → non-urgent (new features)

**3/** Banners vs toasts vs modals — quick reference:

Banner: non-blocking, manual dismiss → persistent info
Toast: non-blocking, auto-dismiss 3-8s → action confirmations
Modal: blocking + focus trap → critical decisions

Pick the wrong one and you create UX friction.

**4/** The production gotcha: a useState(true) banner shows on every page load.

You need frequency rules: show once, once per session, or N times total.

Facebook's own research: reducing notification volume improved long-term retention.

**5/** Six banner types every SaaS uses:
- Feature announcement (Mixpanel)
- Upgrade prompt (HubSpot)
- Maintenance notice (GitHub)
- Onboarding prompt (Zapier)
- Feedback request (Monday.com)
- Seasonal promo (Wordtune)

**6/** Full breakdown with React code examples, comparison tables, and the ARIA gotchas:

https://usertourkit.com/blog/what-is-in-app-banner
