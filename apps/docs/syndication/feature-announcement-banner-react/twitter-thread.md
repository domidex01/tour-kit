## Thread (6 tweets)

**1/** In-app banners have a 100% open rate. Email sits at 20%. Push notifications get muted by 60% of users. Yet most React banner tutorials stop at a useState toggle and call it done. Here's what they miss:

**2/** Problem 1: No persistence. User dismisses the banner, refreshes, sees it again. You need localStorage tracking with view counts and dismissal timestamps. That's ~40 lines of boilerplate most tutorials skip.

**3/** Problem 2: No frequency control. "Show once" is easy. "Show 3 times total" or "every 7 days until they migrate" requires tracking view counts across sessions. 5 different frequency modes cover most real-world patterns.

**4/** Problem 3: The ARIA gotcha nobody mentions. role="alert" containers must be empty on page load. Screen readers only announce content that appears dynamically inside the container. Conditionally rendering the whole div = screen readers miss it entirely.

**5/** Problem 4: No analytics granularity. Tracking "dismissed: true" isn't enough. You need to know HOW they dismissed — close button vs CTA click vs Escape key. 7 distinct reasons give you actionable UX data.

**6/** I wrote a tutorial covering all of this in under 60 lines of TypeScript using @tour-kit/announcements (headless, sub-4KB gzipped). Includes styled + headless variants, frequency table, and troubleshooting.

Full tutorial: https://usertourkit.com/blog/feature-announcement-banner-react
