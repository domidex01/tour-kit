## Subject: Tutorial: Feature announcement banners in React with frequency control + ARIA

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): peter@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a tutorial on building production-grade feature announcement banners in React — covering the three things most banner tutorials skip: localStorage persistence, display frequency control (5 modes including "show 3 times total" and "every 7 days"), and the role="alert" ARIA gotcha where screen readers miss the announcement if the container isn't in the DOM on mount.

The implementation uses @tour-kit/announcements (headless, under 4KB gzipped) and takes about 60 lines across 3 files. Includes TypeScript examples, a frequency comparison table, and troubleshooting section.

Link: https://usertourkit.com/blog/feature-announcement-banner-react

Thanks,
Domi
