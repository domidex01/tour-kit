## Title: The W3C tooltip pattern still lacks task force consensus in 2026

## URL: https://usertourkit.com/blog/what-is-a-tooltip

## Comment to post immediately after:

I wrote a developer-focused reference on tooltips after realizing that most "what is a tooltip" articles are written by product marketers and skip the technical details.

Some findings that surprised me:

1. `role="tooltip"` is defined in the WAI-ARIA spec but has no meaningful effect on screen reader announcements. Sarah Higley (Microsoft) confirmed `aria-describedby` does all the heavy lifting.

2. The W3C APG tooltip pattern is still work-in-progress — no task force consensus after years. We're building production UI against an unfinished spec.

3. WCAG 1.4.13 requires three properties (dismissable, hoverable, persistent) that most custom tooltip implementations fail to meet.

4. 59% of web traffic is mobile, but hover-only tooltips are invisible on touch devices. There's no great solution — long-press, tap-to-toggle, and inline text all have tradeoffs.

The article covers the four functional tooltip types (informational, instructional, validation, progress), a minimal React implementation, and how tooltips work differently inside product tours vs standard UI.

Written from the perspective of building Tour Kit (an open-source headless tour library for React), so there's some product context, but the tooltip reference stands on its own.
