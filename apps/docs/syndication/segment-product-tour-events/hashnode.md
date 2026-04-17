---
title: "Tour Kit + Segment: piping tour events to every analytics tool"
slug: "segment-product-tour-events"
canonical: https://usertourkit.com/blog/segment-product-tour-events
tags: react, javascript, web-development, analytics
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/segment-product-tour-events)*

# Tour Kit + Segment: piping tour events to every analytics tool

Most product tour libraries send events to one analytics tool. You wire up GA4 or Mixpanel, declare victory, and move on. Six months later, the data team asks for the same events in BigQuery. Then marketing wants them in HubSpot. You're writing glue code for each destination.

Segment solves this by sitting between your app and every downstream tool. One `analytics.track()` call fans out to 400+ destinations without extra code. Tour Kit's plugin-based analytics architecture maps cleanly to Segment's `track` and `identify` methods. You write one plugin, and every tour event flows everywhere.

This tutorial walks through building a custom Segment plugin for Tour Kit in about 50 lines of TypeScript. Full code examples and gotchas included.

Read the full article with all code examples: [Tour Kit + Segment: piping tour events to every analytics tool](https://usertourkit.com/blog/segment-product-tour-events)
