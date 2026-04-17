## Subreddit: r/reactjs

**Title:** TIL role="tooltip" does nothing for screen readers — aria-describedby does all the work

**Body:**

I was writing up a reference on tooltip implementation patterns and went down a rabbit hole on accessibility. Turns out `role="tooltip"` is defined in the WAI-ARIA spec but has zero meaningful effect on screen reader announcements. Sarah Higley (Microsoft accessibility engineer) confirmed that `aria-describedby` and `aria-labelledby` are the attributes doing the actual work.

Also learned that the W3C's own APG tooltip pattern *still* lacks task force consensus as of April 2026. So we're all building against a spec that isn't finalized.

Some other things I put together while researching:

- WCAG 1.4.13 requires tooltips to be dismissable (Escape), hoverable (mouse can move onto the tooltip), and persistent (stays until user acts). Most custom tooltip implementations fail at least one of these.
- 59% of web traffic is mobile. Hover-only tooltips are invisible to the majority of users.
- Floating UI handles tooltip positioning in ~3KB gzipped. The native `title` attribute costs 0KB but has no keyboard support and inconsistent screen reader behavior.
- There are four functional tooltip types: informational, instructional, validation, and progress. The last two show up mostly in product tours, not standard UI.

I wrote the full breakdown with a React code example and a comparison table here: [usertourkit.com/blog/what-is-a-tooltip](https://usertourkit.com/blog/what-is-a-tooltip)

Curious if anyone else has run into the `role="tooltip"` thing. Did you know it was effectively a no-op?
