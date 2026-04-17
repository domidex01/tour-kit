## Subreddit: r/reactjs (cross-post to r/devops)

**Title:** I built a plugin that turns product tour events into OpenTelemetry traces --- here's the 60-line implementation

**Body:**

Been working on connecting frontend onboarding flows to our distributed tracing pipeline. The problem: product analytics (PostHog, Mixpanel) shows *what* happened (funnel drop-offs), but not *why*. When users abandon step 3, we could see the drop-off but not the 4.2-second API call behind it.

The approach: a Tour Kit analytics plugin that creates OTel spans for each tour lifecycle event. `tour_started` becomes a parent span, each step becomes a child span, and abandoned tours get `SpanStatusCode.ERROR`. In Jaeger, you see the full tour as one trace with nested steps. The real win is trace context propagation --- if your fetch calls carry W3C `traceparent` headers, a tour step that triggers an API call creates a single trace from browser to database.

Bundle cost: the OTel browser SDK adds ~30-40KB gzipped. For apps already running OTel for backend services, the incremental cost is zero since the plugin reuses the existing provider.

Gotcha that took an hour to debug: `NEXT_PUBLIC_OTEL_COLLECTOR_URL` must include `/v1/traces` in the path. The OTLP HTTP exporter doesn't append it, and spans just silently disappear.

Full writeup with all the TypeScript code, Jaeger setup, and event mapping table: https://usertourkit.com/blog/tour-kit-opentelemetry-observability-onboarding

Curious if anyone else is doing frontend OTel instrumentation for user flows, or if this is mostly a backend-only pattern in your teams.
