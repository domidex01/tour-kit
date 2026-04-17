# How to send product tour events to every analytics tool with one integration

## Build a Segment plugin that routes tour lifecycle data to 400+ destinations

*Originally published at [usertourkit.com](https://usertourkit.com/blog/segment-product-tour-events)*

Most product tour libraries send events to one analytics tool at a time. You wire up Google Analytics or Mixpanel, and when another team needs the same data in a different tool, you write more glue code.

Segment changes this equation. It sits between your app and every downstream analytics tool. One `analytics.track()` call fans out to 400+ destinations without additional integration code. As of April 2026, Segment's Analytics.js 2.0 ships at about 16KB gzipped after a 70% reduction from the previous version.

Tour Kit is an open-source React library for product tours. Its analytics plugin system maps cleanly to Segment's API. You write one plugin (about 50 lines of TypeScript), and every tour event in your app flows to Amplitude, Mixpanel, BigQuery, HubSpot, and wherever else your Segment workspace sends data.

The key benefit: when you add a new analytics tool next quarter, you configure it in the Segment dashboard. Zero code changes in your React app.

The tradeoff is cost. Segment's free tier caps at 1,000 monthly tracked users with 2 sources. That covers early-stage apps, but pricing jumped roughly 40% in 2025.

Tour Kit's plugin architecture hedges this. If you outgrow Segment, swap the plugin for RudderStack or a direct integration without touching your tour code.

**Read the full tutorial with TypeScript code examples:** [Tour Kit + Segment integration guide](https://usertourkit.com/blog/segment-product-tour-events)

*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
