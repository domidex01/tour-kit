## Title: Building feature announcement banners in React with persistence, frequency control, and ARIA

## URL: https://usertourkit.com/blog/feature-announcement-banner-react

## Comment to post immediately after:

I wrote this after noticing that every "React banner" tutorial stops at a useState toggle and never addresses the three production problems: persistence across sessions, controlling display frequency, and screen reader accessibility.

The most interesting technical detail was the role="alert" behavior. ARIA live regions only fire announcements when content changes dynamically inside an existing container. If you conditionally render the entire div, screen readers miss it. The container needs to exist (empty) on mount, and you inject text into it when the announcement activates.

For frequency control, I implemented 5 modes (once, session, always, N-times, interval-based) backed by localStorage with view counts and dismissal timestamps. The "every N days" pattern solved a real problem for migration warnings — show a banner every 7 days until the user takes action.

The entire implementation is under 60 lines of TypeScript across 3 files, using @tour-kit/announcements (a library I'm building). The headless variant ships 0KB of CSS so it composes with whatever design system you already use.

Curious if others have hit the same role="alert" gotcha or found different approaches to frequency control.
