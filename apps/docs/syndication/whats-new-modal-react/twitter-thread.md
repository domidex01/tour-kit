## Thread (6 tweets)

**1/** Users don't read changelogs. Not on your marketing site, not on GitHub releases.

In-product announcements win because they appear where users already are. But building a proper "What's New" modal in React goes way beyond useState + a div.

**2/** The hidden 80%:

- Per-entry seen/unseen tracking in localStorage
- Frequency rules (once, N times, interval)
- SSR hydration safety for Next.js
- WCAG focus trapping + ESC dismiss
- Analytics to know which updates people actually read

**3/** The native HTML `<dialog>` element handles focus trapping and ESC dismissal for free. 97%+ browser support.

react-modal ships at 188KB. `<dialog>` ships at 0KB.

**4/** Key gotcha: stable entry IDs matter.

If you generate IDs with crypto.randomUUID(), every render creates "new" entries. The modal keeps reappearing.

Use deterministic IDs: `v2-4-0-dark-mode`, not random strings.

**5/** The industry is shifting from measuring announcement open rates to 7-day feature adoption rate.

A thousand impressions mean nothing if nobody tries the feature.

**6/** Full tutorial with TypeScript code, Next.js setup, troubleshooting, and analytics integration:

https://tourkit.dev/blog/whats-new-modal-react

Under 80 lines across 3 files. Built with @tourkit announcements.
