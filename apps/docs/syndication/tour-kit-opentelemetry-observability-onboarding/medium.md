# How to connect product tour events to your distributed traces

## Using OpenTelemetry to turn onboarding analytics into debugging superpowers

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-opentelemetry-observability-onboarding)*

Product analytics tools tell you *what* happened. OpenTelemetry tells you *why*.

When a user abandons your onboarding tour at step 3, PostHog shows a drop-off in a funnel chart. It can't tell you that the API call behind step 3 took 4.2 seconds, or that the tooltip rendered before the target element loaded.

OpenTelemetry (OTel) is the CNCF's vendor-neutral standard for traces, metrics, and logs. As of April 2026, the browser SDK pulls roughly 480K weekly downloads on npm. Enterprise teams already use it to trace API requests across services. Connecting those backend traces to frontend user experience is the missing piece.

I built a Tour Kit analytics plugin that creates OTel spans for every tour lifecycle event. Those spans join the same distributed trace as your backend calls. Step 3 didn't just drop off --- it triggered a GET request, which hit a cold Lambda, which queried a table missing an index. About 60 lines of TypeScript.

The full walkthrough with all code examples is here: [Tour Kit + OpenTelemetry: observability for onboarding flows](https://usertourkit.com/blog/tour-kit-opentelemetry-observability-onboarding)

**Key takeaways:**

- OTel and product analytics serve different purposes. OTel shows *why*, analytics shows *what*. Run both.
- The browser SDK adds 30--40KB gzipped. For enterprise apps already running OTel for backend tracing, the incremental cost is zero.
- Abandoned tours get `SpanStatusCode.ERROR`, which means you can alert on onboarding failures through Honeycomb or Grafana.
- The OTLP exporter is vendor-neutral --- works with Jaeger, Grafana Tempo, Honeycomb, and Datadog without plugin changes.

*Note: Import this article to Medium via medium.com/p/import to automatically set the canonical URL.*

Suggested publications: JavaScript in Plain English, Better Programming, The Startup
