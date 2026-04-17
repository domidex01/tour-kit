## Thread (6 tweets)

**1/** Most product tour libraries send events to one analytics tool. Then the data team wants BigQuery. Then marketing wants HubSpot. Then product adds Amplitude.

You end up writing 4 separate analytics integrations for the same tour events.

Here's how I fixed this with Segment:

**2/** Tour Kit has a plugin-based analytics architecture. Each plugin implements track(), identify(), flush(), and destroy().

Segment's analytics.track() maps directly to this interface. The plugin is ~40 lines of TypeScript.

**3/** 6 tour lifecycle events flow through one pipe:
- tourkit_tour_started
- tourkit_step_viewed
- tourkit_step_completed
- tourkit_tour_completed
- tourkit_tour_skipped
- tourkit_tour_abandoned

Segment forwards them to 400+ destinations.

**4/** The real win: adding a new analytics tool is a Segment dashboard toggle. Zero code changes. Zero deploys.

Analytics.js 2.0 is ~16KB gzipped. Tour Kit core is <8KB. Combined: ~24KB total overhead.

**5/** Gotcha: Segment's free tier caps at 1,000 MTUs. Their pricing jumped 40% in 2025.

But Tour Kit's plugin interface is CDP-agnostic. Swap to RudderStack later without changing any tour code.

**6/** Full tutorial with TypeScript code, gotchas, and event mapping table:

https://usertourkit.com/blog/segment-product-tour-events

Tour Kit is open source (MIT). The analytics package is under 3KB gzipped.
