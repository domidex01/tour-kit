In-app announcement banners reach 100% of active users. Email open rates average 20%.

Yet most React teams still hardcode banners with useState and lose dismissal state on every page refresh.

I wrote a tutorial covering the three production problems tutorials skip:

1. Persistence — tracking dismissals and view counts in localStorage across sessions
2. Frequency control — 5 modes from "show once" to "every 7 days until migration"
3. Accessibility — the role="alert" gotcha where screen readers miss announcements if the container isn't in the DOM on mount

The implementation uses @tour-kit/announcements (headless, under 4KB gzipped) and takes about 60 lines of TypeScript. Both styled and headless variants included so you can use it with any design system.

Full tutorial with code examples: https://usertourkit.com/blog/feature-announcement-banner-react

#react #typescript #webdevelopment #frontend #accessibility
