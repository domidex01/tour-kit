## Thread (6 tweets)

**1/** Product analytics shows WHAT happened in your onboarding: "40% drop-off at step 3."

OpenTelemetry shows WHY: "The API call behind step 3 took 4.2 seconds because of a cold Lambda + missing DB index."

Here's how to connect them in ~60 lines of TypeScript.

**2/** The approach: a Tour Kit analytics plugin that creates OTel spans for every tour event.

`tour_started` = parent span
`step_viewed` = child span
`tour_abandoned` = SpanStatusCode.ERROR (shows red in Jaeger)

Result: one trace from button click to database query.

**3/** The bundle cost question everyone asks:

OTel browser SDK = ~30-40KB gzipped
Tour Kit core = <8KB gzipped

If your app already loads OTel for backend tracing, the Tour Kit plugin adds zero incremental bundle cost. It reuses the existing provider.

**4/** The gotcha that cost an hour of debugging:

`NEXT_PUBLIC_OTEL_COLLECTOR_URL` must include `/v1/traces` in the path.

The OTLP HTTP exporter does NOT append it automatically. Spans just silently disappear.

**5/** Best part: the OTLP exporter is vendor-neutral.

Same plugin works with Jaeger, Grafana Tempo, Honeycomb, Datadog, and New Relic. Change the URL, spans flow to the new backend. Zero code changes.

**6/** Full walkthrough with all the TypeScript code, Jaeger Docker setup, and event mapping table:

https://usertourkit.com/blog/tour-kit-opentelemetry-observability-onboarding

For enterprise teams already running OTel --- this is zero additional infrastructure.
