## Thread (6 tweets)

**1/** Your product tour runs but GTM doesn't know about it. No conversion tags fire. No funnel data in GA4.

Here's how to fix that with 28 lines of TypeScript. 🧵

**2/** The approach: write a single analytics plugin that receives typed tour events and pushes them to `window.dataLayer`.

Every push needs the `event` key. Without it, GTM stores data but no trigger fires. That's the #1 GTM debugging headache.

**3/** The biggest SPA gotcha: don't use GTM's History Change trigger for React apps.

React Router dispatches 2-3 history events per navigation. Your trigger fires multiple times per route change.

Custom Event triggers fix this completely.

**4/** GTM config in 3 steps:

- 6 Data Layer Variables (tour_id, step_id, step_index, etc.)
- 5 Custom Event Triggers (tour_started, step_viewed, tour_completed...)
- 1 GA4 Event Tag with RegEx trigger

Or 5 separate tags. Same data either way.

**5/** Debug with GTM Preview Mode:
- Tag Assistant shows every dataLayer.push in real time
- Click an event → Variables tab → verify values
- Tags tab → confirm "Fired"
- Cross-check in GA4 DebugView (events arrive in ~5 seconds)

**6/** Full tutorial with code, GTM configuration tables, Consent Mode v2 setup, SSR gotchas for Next.js, and event schema reference:

https://usertourkit.com/blog/track-tour-kit-events-google-tag-manager
