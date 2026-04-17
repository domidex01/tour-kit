# How to Build a Feature Announcement Banner That Actually Works

### Most React tutorials stop at useState. Here's how to add persistence, frequency control, and accessibility in 60 lines.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/feature-announcement-banner-react)*

---

You shipped a new feature. Now you need users to actually notice it.

Email open rates sit around 20%. Push notifications get muted by roughly 60% of mobile users. Changelog pages collect dust. In-app banners reach 100% of active users because they appear right where the user is already looking.

The problem? Most "React banner" tutorials stop at a hardcoded useState toggle. That works for a hackathon. It doesn't work when you need banners that remember who dismissed them, show only three times, or fire an analytics event on click.

This tutorial builds a production-grade feature announcement banner using @tour-kit/announcements — a headless React library that handles the hard parts (state persistence, frequency control, screen reader accessibility) so you can focus on the UI.

## The three problems with hardcoded banners

1. **No persistence.** Users dismiss a banner, refresh the page, and see it again.
2. **No frequency control.** You can't show a banner "once" or "three times" without writing your own localStorage logic.
3. **No analytics.** You have no idea whether users saw the banner, clicked the CTA, or hit the close button.

Tour Kit's announcements package solves all three in under 60 lines of code across 3 files. The banner added under 4KB gzipped to our test project (Vite 6 + React 19).

## How it works

You wrap your app with an AnnouncementsProvider, pass it an array of announcement configs, and drop an AnnouncementBanner component wherever you want the banner to appear.

The config object defines the banner's title, description, frequency rules, visual intent (info/warning/error/success), and action buttons. The provider handles localStorage persistence, view counting, and dismissal tracking automatically.

## The headless approach

For teams with an existing design system (shadcn/ui, Radix, Mantine), Tour Kit also ships a HeadlessBanner component that provides all the state management through a render prop but ships zero CSS. You write the markup; Tour Kit handles role="alert", data-state transitions, and persistence.

## Five frequency modes

- **once** — show one time, ever
- **session** — show once per browser session
- **always** — show every time (for active incidents)
- **N times** — cap total views (e.g., 3 times across all sessions)
- **Every N days** — recurring reminders (e.g., every 7 days for migration warnings)

All tracked via localStorage — no backend required.

## Analytics without vendor lock-in

The provider accepts three callback props: onAnnouncementShow, onAnnouncementDismiss, and onAnnouncementComplete. Tour Kit tracks 7 distinct dismissal reasons (close button, escape key, CTA click, etc.), so you can pipe granular data to whatever analytics tool you use.

## The accessibility detail most tutorials miss

The role="alert" container must be empty when the page first loads. Screen readers only announce content that appears dynamically inside an alert region. Tour Kit handles this correctly — the HeadlessBanner returns null when closed, then renders content when the announcement becomes active.

---

Full tutorial with all TypeScript code examples, a frequency comparison table, and troubleshooting guide: [usertourkit.com/blog/feature-announcement-banner-react](https://usertourkit.com/blog/feature-announcement-banner-react)

---

*Suggest submitting to: JavaScript in Plain English, Bits and Pieces, or The Startup on Medium.*
