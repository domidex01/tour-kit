## Subject: Tour Kit + OpenTelemetry integration — distributed tracing for onboarding flows

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site
- Observability newsletter (o11y.news): submit via site

## Email body:

Hi [name],

I wrote a tutorial on building an OpenTelemetry plugin that converts React product tour events into distributed traces. The plugin creates parent spans per tour with child spans per step, connecting frontend onboarding flows to backend API traces through W3C Trace Context propagation. ~60 lines of TypeScript, works with Jaeger, Grafana Tempo, Honeycomb, and Datadog.

Your readers working on enterprise React apps with existing OTel pipelines would find this useful --- it's the kind of frontend-to-backend observability connection that doesn't get covered much.

Link: https://usertourkit.com/blog/tour-kit-opentelemetry-observability-onboarding

Thanks,
Domi
