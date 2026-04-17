## Subreddit: r/reactjs

**Title:** I built a Segment plugin for piping product tour events to 400+ analytics tools — here's the pattern

**Body:**

I've been working on Tour Kit, an open-source React library for product tours. One of the things that kept coming up was analytics: every team wants tour events in a different tool. GA4 for the marketing team, Amplitude for product, BigQuery for the data team.

Instead of writing a separate plugin for each destination, I built a Segment integration. Tour Kit has a plugin interface with `track`, `identify`, `flush`, and `destroy` methods. Segment's `analytics.track()` maps directly to that, so the plugin is about 40 lines of TypeScript.

The event mapping is straightforward — 6 lifecycle events (tour_started, step_viewed, step_completed, tour_completed, tour_skipped, tour_abandoned) get prefixed and forwarded through Segment to whatever destinations you've configured. Once it's wired up, adding a new analytics tool is a dashboard toggle, not a code change.

One gotcha worth flagging: Segment's free tier caps at 1,000 MTUs with 2 sources. Fine for dev/staging, but their pricing jumped 40% last year. The plugin interface is CDP-agnostic though, so you can swap to RudderStack later without changing tour code.

Full writeup with code: https://usertourkit.com/blog/segment-product-tour-events

Happy to answer questions about the plugin pattern or Tour Kit's analytics architecture.
