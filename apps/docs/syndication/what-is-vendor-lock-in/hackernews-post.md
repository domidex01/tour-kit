## Title: Vendor lock-in in SaaS onboarding tools: four types and how to avoid them

## URL: https://usertourkit.com/blog/what-is-vendor-lock-in

## Comment to post immediately after:

Vendor lock-in is well-understood for cloud infrastructure, but I haven't seen much written about it in the context of onboarding/product tour tools specifically.

The research turned up some interesting data points. CloudNuro puts the SaaS exit tax at 150-200% of annual contract value. Pendo's data export is Avro files on a 1-24 hour batch cadence, incompatible with anything outside Snowflake. Appcues gates two-way integrations behind its premium tier. The average enterprise now manages 291 SaaS apps (up from 110 in 2020), so these lock-in surfaces compound.

What surprised me most is "process lock-in" — the invisible cost of training teams on proprietary visual builders. When your PMs have built 50 onboarding flows in a vendor-specific tool, the switching cost isn't engineering. It's recreating content.

The EU Data Act (effective Sept 2025) now mandates machine-readable export formats for SaaS vendors in Europe. Curious whether this will actually change vendor behavior or just produce compliance theater.

I build Tour Kit (headless React library for product tours), so I obviously have a perspective here. The article tries to be fair about the tradeoffs — headless means no visual builder, which is a real limitation for PM-led teams.
