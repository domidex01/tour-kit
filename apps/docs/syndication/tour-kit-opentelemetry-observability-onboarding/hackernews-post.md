## Title: Connecting product tour events to OpenTelemetry distributed traces (React, TypeScript)

## URL: https://usertourkit.com/blog/tour-kit-opentelemetry-observability-onboarding

## Comment to post immediately after:

We've been building Tour Kit, a headless product tour library for React, and one pattern that kept coming up from enterprise users was connecting onboarding events to their existing OTel pipelines.

Product analytics tools show funnel drop-offs, but they can't tell you that the API call behind step 3 took 4.2 seconds. This plugin creates OTel spans for tour lifecycle events that join the same distributed traces as backend API calls. In Jaeger, you see the tour as a parent span with child spans per step, and abandoned tours show up red with SpanStatusCode.ERROR.

The implementation is about 60 lines of TypeScript. The main design decision was making `tour_started` a long-lived parent span (ends when the tour completes or is abandoned) with step events as child spans nested under it.

The OTel browser SDK adds 30-40KB gzipped, which is meaningful. This is clearly an enterprise pattern --- for simpler setups, PostHog or GA4 is the right call. But for teams already running OTel Collector for backend services, it's zero additional infrastructure.

One gotcha that cost us an hour: the OTLP HTTP exporter doesn't append `/v1/traces` to the collector URL. If you just pass the host, spans silently vanish.
