Your product tour analytics shouldn't require a separate integration for every downstream tool.

I just published a guide on connecting Tour Kit (open-source React product tour library) to Segment, so tour lifecycle events flow to every analytics destination from a single plugin.

The numbers: Analytics.js 2.0 ships at 16KB gzipped. Tour Kit's core is under 8KB. Combined overhead is ~24KB. The plugin itself is about 40 lines of TypeScript.

The real win isn't the code — it's that adding Amplitude, BigQuery, or any of Segment's 400+ destinations becomes a dashboard toggle instead of a sprint task.

One caveat for growing teams: Segment's free tier (1,000 MTUs) works for early-stage, but pricing increased 40% in 2025. Tour Kit's plugin interface is CDP-agnostic, so you can swap to RudderStack later.

Full tutorial with code: https://usertourkit.com/blog/segment-product-tour-events

#react #analytics #segment #opensource #productdevelopment
