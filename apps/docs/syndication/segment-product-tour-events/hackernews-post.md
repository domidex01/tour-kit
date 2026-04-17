## Title: Tour Kit + Segment: Piping Product Tour Events to Every Analytics Tool

## URL: https://usertourkit.com/blog/segment-product-tour-events

## Comment to post immediately after:

I've been building Tour Kit, an open-source React product tour library. One recurring problem: teams need tour event data in different analytics tools, and maintaining separate integrations per destination gets messy.

This article walks through building a Segment plugin (~40 lines of TypeScript) that maps Tour Kit's 6 lifecycle events to Segment's track API. The main win is that adding a new analytics destination becomes a Segment dashboard toggle instead of a code change.

Some data points: Analytics.js 2.0 is about 16KB gzipped (70% smaller than v1), Tour Kit's core is under 8KB, so combined overhead is ~24KB. Segment's free tier covers 1,000 MTUs with unlimited destinations. The plugin interface is CDP-agnostic, so teams can swap to RudderStack later.

Honest limitation: Tour Kit is React 18+ only and has no visual builder. You write tour steps in code. This integration is for developer-led teams that want full control over their analytics pipeline.
