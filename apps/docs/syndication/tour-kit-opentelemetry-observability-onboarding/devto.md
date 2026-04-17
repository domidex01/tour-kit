---
title: "Turning product tour events into OpenTelemetry traces (React + TypeScript)"
published: false
description: "Product analytics shows funnel drop-offs. OTel traces show the 4.2-second API call behind step 3. Here's how to connect them with a 60-line Tour Kit plugin."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/tour-kit-opentelemetry-observability-onboarding
cover_image: https://usertourkit.com/og-images/tour-kit-opentelemetry-observability-onboarding.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-opentelemetry-observability-onboarding)*

# Tour Kit + OpenTelemetry: observability for onboarding flows

Product analytics tools tell you *what* happened. OpenTelemetry tells you *why*. When a user abandons your onboarding tour at step 3, PostHog shows a drop-off in a funnel chart. It can't tell you that the API call behind step 3 took 4.2 seconds, or that the tooltip rendered before the target element loaded.

OpenTelemetry (OTel) is the CNCF's vendor-neutral standard for traces, metrics, and logs. As of April 2026, `@opentelemetry/sdk-trace-web` pulls roughly 480K weekly downloads on npm, and the project has over 3,500 contributors ([OpenTelemetry GitHub](https://github.com/open-telemetry)). Enterprise teams already use it to trace API requests across services. Connecting those backend traces to frontend user experience is the missing piece.

Tour Kit's `AnalyticsPlugin` interface gives you the hook. One plugin creates OTel spans for every tour lifecycle event, and those spans join the same distributed trace as your backend calls. Step 3 didn't just drop off. It triggered `GET /api/workspace`, which hit a cold Lambda, which queried a table missing an index.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## What you'll build

This integration creates a Tour Kit analytics plugin that converts tour lifecycle events into OpenTelemetry spans, connected to your existing distributed traces through W3C Trace Context propagation and exportable to any OTLP-compatible backend (Jaeger, Grafana Tempo, Honeycomb, Datadog) via the OTel Collector. The plugin wraps each tour as a parent span with child spans per step. About 60 lines of TypeScript.

Tour Kit requires React 18.2+ and has no visual builder. If your team needs drag-and-drop, this isn't the right tool.

## Why OpenTelemetry + Tour Kit?

OpenTelemetry gives you something product analytics tools don't: causality across service boundaries. When a tour step fails or a user abandons the flow, OTel traces connect that frontend event to the exact backend operation that caused the problem. You stop guessing why step 3 has a 40% drop-off and start seeing the 95th-percentile latency spike on the API call behind it.

| Approach | What you see | Causality | Cost model |
|---|---|---|---|
| Product analytics (PostHog, Mixpanel) | Funnel drop-offs, event counts | None (events are isolated) | Per-event or per-MTU |
| Tour Kit + OTel traces | Span timelines per tour step, linked to backend traces | Full distributed trace | Per-span ingestion (self-hosted = free) |
| Both (recommended) | Funnels for product decisions, traces for debugging | Correlated via user ID | Combined |

The catch: OTel's browser SDK adds roughly 30-40KB gzipped depending on which instrumentations you load. On top of Tour Kit's core at under 8KB gzipped, that's meaningful. For enterprise apps already running OTel for backend tracing, the frontend SDK is a natural extension. For a marketing site with a 3-step tour? Overkill. Use PostHog or GA4 instead.

## Prerequisites

Unlike product analytics integrations that send events to a SaaS dashboard, this plugin sends OpenTelemetry spans to a trace backend that accepts the OTLP protocol, so you need infrastructure that can ingest and visualize distributed traces before starting.

- React 18.2+ or React 19
- An OTel Collector endpoint (self-hosted or SaaS like Honeycomb or Datadog)
- Tour Kit installed: `@tourkit/core`, `@tourkit/react`, `@tourkit/analytics`
- OTel browser packages (see install command below)

```bash
npm install @opentelemetry/sdk-trace-web @opentelemetry/exporter-trace-otlp-http @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/api
```

No tour yet? The [React 19 quickstart](https://usertourkit.com/blog/add-product-tour-react-19) gets you running in 5 minutes. For OTel Collector setup, the [official docs](https://opentelemetry.io/docs/collector/getting-started/) cover Docker and Kubernetes.

## Step 1: Initialize the OTel trace provider

The OTel Web SDK needs a `WebTracerProvider` configured with an exporter before any spans can be created. Configure it once at app startup. The provider registers globally, so Tour Kit's plugin creates spans through `@opentelemetry/api` without importing the SDK directly.

```tsx
// src/lib/otel.ts
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-web'

const resource = Resource.default().merge(
  new Resource({
    [ATTR_SERVICE_NAME]: 'my-app-frontend',
    [ATTR_SERVICE_VERSION]: '1.0.0',
  })
)

const exporter = new OTLPTraceExporter({
  url: process.env.NEXT_PUBLIC_OTEL_COLLECTOR_URL ?? 'http://localhost:4318/v1/traces',
})

const provider = new WebTracerProvider({
  resource,
  spanProcessors: [new BatchSpanProcessor(exporter)],
})

provider.register()

export { provider }
```

The `BatchSpanProcessor` buffers spans and sends them in batches rather than one at a time. Default batch size is 512 spans with a 5-second flush interval. For production, tune `maxExportBatchSize` and `scheduledDelayMillis` based on your Collector's ingestion rate.

One gotcha we hit: `NEXT_PUBLIC_OTEL_COLLECTOR_URL` must include the full path (`/v1/traces`), not just the host. The OTLP HTTP exporter doesn't append it automatically. If spans silently disappear, check this first.

## Step 2: Build the OpenTelemetry plugin

Tour Kit's `AnalyticsPlugin` interface has 5 methods: `init`, `track`, `identify`, `flush`, and `destroy`. The OTel plugin maps `track` to span creation, using the tour ID as the parent span name and each step as a child span. Result: a waterfall view in Jaeger where the tour appears as one trace with nested step spans.

```tsx
// src/lib/otel-plugin.ts
import { trace, type Span, SpanStatusCode, context } from '@opentelemetry/api'
import type { AnalyticsPlugin, TourEvent } from '@tour-kit/analytics'

const TRACER_NAME = 'tourkit'

interface OtelPluginOptions {
  /** Tracer name override (default: 'tourkit') */
  tracerName?: string
  /** Add custom attributes to all spans */
  globalAttributes?: Record<string, string | number | boolean>
}

export function openTelemetryPlugin(options: OtelPluginOptions = {}): AnalyticsPlugin {
  const tracerName = options.tracerName ?? TRACER_NAME
  const tourSpans = new Map<string, Span>()

  const getTracer = () => trace.getTracer(tracerName)

  return {
    name: 'opentelemetry',

    init() {
      const tracer = getTracer()
      if (!tracer) {
        console.warn(
          'Tour Kit OTel plugin: no tracer provider registered. ' +
          'Call provider.register() before initializing Tour Kit.'
        )
      }
    },

    track(event: TourEvent) {
      const tracer = getTracer()
      const attrs: Record<string, string | number | boolean> = {
        'tourkit.tour_id': event.tourId,
        'tourkit.event': event.eventName,
        ...(event.stepId && { 'tourkit.step_id': event.stepId }),
        ...(event.stepIndex !== undefined && { 'tourkit.step_index': event.stepIndex }),
        ...(event.totalSteps !== undefined && { 'tourkit.total_steps': event.totalSteps }),
        ...(event.duration && { 'tourkit.duration_ms': event.duration }),
        ...(event.userId && { 'enduser.id': event.userId }),
        ...options.globalAttributes,
      }

      switch (event.eventName) {
        case 'tour_started': {
          const span = tracer.startSpan(`tour:${event.tourId}`, { attributes: attrs })
          tourSpans.set(event.tourId, span)
          break
        }

        case 'step_viewed':
        case 'step_completed':
        case 'step_skipped': {
          const parentSpan = tourSpans.get(event.tourId)
          const ctx = parentSpan
            ? trace.setSpan(context.active(), parentSpan)
            : context.active()

          const stepSpan = tracer.startSpan(
            `step:${event.stepId ?? event.stepIndex}`,
            { attributes: attrs },
            ctx
          )
          stepSpan.end()
          break
        }

        case 'tour_completed': {
          const span = tourSpans.get(event.tourId)
          if (span) {
            span.setAttributes(attrs)
            span.setStatus({ code: SpanStatusCode.OK })
            span.end()
            tourSpans.delete(event.tourId)
          }
          break
        }

        case 'tour_skipped':
        case 'tour_abandoned': {
          const span = tourSpans.get(event.tourId)
          if (span) {
            span.setAttributes({
              ...attrs,
              'tourkit.outcome': event.eventName === 'tour_skipped' ? 'skipped' : 'abandoned',
            })
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `Tour ${event.eventName.replace('tour_', '')} at step ${event.stepIndex}`,
            })
            span.end()
            tourSpans.delete(event.tourId)
          }
          break
        }
      }
    },

    flush() {
      // BatchSpanProcessor handles flushing automatically
    },

    destroy() {
      for (const [tourId, span] of tourSpans) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: 'Tour span orphaned on plugin destroy',
        })
        span.end()
        tourSpans.delete(tourId)
      }
    },
  }
}
```

The key design decision: `tour_started` creates a long-lived parent span, and step events create child spans nested under it. In Jaeger, you see the tour as a single trace entry. Expand it and each step shows timing, attributes, and status. Abandoned tours get `SpanStatusCode.ERROR` so they appear red.

We use `enduser.id` for user identification because it's an [OpenTelemetry semantic convention](https://opentelemetry.io/docs/specs/semconv/attributes-registry/enduser/) that Honeycomb and Datadog recognize automatically.

## Step 3: Wire the plugin into your app

Same provider pattern as every other Tour Kit analytics integration. Import the OTel setup file (which registers the global provider), create the analytics instance, wrap your component tree.

```tsx
// src/lib/analytics.ts
import '@/lib/otel' // Side-effect: registers the trace provider
import { createAnalytics } from '@tour-kit/analytics'
import { openTelemetryPlugin } from './otel-plugin'

export const analytics = createAnalytics({
  plugins: [
    openTelemetryPlugin({
      globalAttributes: {
        'deployment.environment': process.env.NODE_ENV ?? 'development',
      },
    }),
  ],
  debug: process.env.NODE_ENV === 'development',
})
```

Then wrap your layout:

```tsx
// src/app/providers.tsx
'use client'

import { TourKitProvider } from '@tourkit/react'
import { AnalyticsProvider } from '@tourkit/analytics'
import { analytics } from '@/lib/analytics'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsProvider analytics={analytics}>
      <TourKitProvider>
        {children}
      </TourKitProvider>
    </AnalyticsProvider>
  )
}
```

Want OTel traces *and* product analytics? Stack plugins:

```tsx
import { posthogPlugin } from '@tour-kit/analytics/posthog'

export const analytics = createAnalytics({
  plugins: [
    openTelemetryPlugin(),
    posthogPlugin({ apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY! }),
  ],
})
```

Both fire in parallel on every tour event. PostHog handles funnels and retention. OTel handles distributed tracing and latency debugging.

## Step 4: Verify traces in Jaeger

Confirm spans arrive locally before deploying to production. Jaeger's all-in-one Docker image bundles the Collector, storage, and UI on a single container, accepting OTLP over HTTP on port 4318.

```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:1.62
```

Open `http://localhost:16686`, select the `my-app-frontend` service from the dropdown, and trigger a tour in your dev environment. You should see a trace with:

- A parent span named `tour:your-tour-id` covering the full tour duration
- Child spans for each `step_viewed` and `step_completed` event
- Red spans for abandoned or skipped tours

No spans showing up? Three things to check:

- The Collector URL includes `/v1/traces` (not just the host)
- CORS headers allow your app's origin to reach the Collector
- `provider.register()` in `otel.ts` runs before Tour Kit initializes

We tested in a Next.js 15 app with React 19. Spans appeared in Jaeger within the 5-second `BatchSpanProcessor` flush window.

| Tour Kit event | OTel span name | Span kind | Key attributes |
|---|---|---|---|
| `tour_started` | `tour:onboarding` | Parent (long-lived) | tourkit.tour_id, tourkit.total_steps |
| `step_viewed` | `step:welcome` | Child of tour | tourkit.step_id, tourkit.step_index |
| `step_completed` | `step:welcome` | Child of tour | tourkit.duration_ms |
| `tour_completed` | `tour:onboarding` | Parent (ends) | tourkit.duration_ms, status: OK |
| `tour_abandoned` | `tour:onboarding` | Parent (ends) | tourkit.outcome: abandoned, status: ERROR |

## Going further

Once tour spans flow through your OTel pipeline, four patterns become available without changing any tour code:

- **Trace context propagation** connects frontend tour spans to backend API traces. Add `@opentelemetry/instrumentation-fetch` and a step that triggers an API call creates a single trace from browser to database.
- **Custom metrics** from spans let you track p50/p95 tour completion times in Grafana. The OTel Collector's `spanmetrics` connector generates histograms from span durations automatically.
- **Alerting on tour failures** works because abandoned tours get `SpanStatusCode.ERROR`. Configure Honeycomb Triggers or Grafana alerts when the error rate on `tour:*` spans crosses a threshold.
- **Tail-based sampling** through the Collector keeps all error traces while dropping successful ones. Full visibility on failures without the storage bill.

The Collector shipped with native Kubernetes Operator support in late 2025 ([OpenTelemetry blog](https://opentelemetry.io/blog/)). For teams already running it for backend services, adding frontend tour traces is zero additional infrastructure.

## FAQ

### Does OpenTelemetry replace product analytics for tour tracking?

OTel traces show *why* something happened by connecting frontend events to backend operations. Product analytics tools show *what* happened with funnels and retention charts. Different purposes. Most enterprise teams run both, and Tour Kit's plugin architecture makes stacking them a two-line change.

### How much does OpenTelemetry add to my bundle size?

The `@opentelemetry/sdk-trace-web` package with OTLP HTTP exporter adds roughly 30-40KB gzipped. Combined with Tour Kit's core at under 8KB gzipped, total is about 40-50KB. If your app already loads OTel for fetch tracing, the incremental cost of this plugin is zero since it reuses the existing provider.

### Can I use this with Grafana Tempo instead of Jaeger?

Yes. The OTLP exporter is vendor-neutral. Change the `url` in `OTLPTraceExporter` to point at your Tempo endpoint and spans flow to Grafana's trace visualization without any plugin changes. Honeycomb, Datadog, and New Relic all accept OTLP directly as well.

### Is the OpenTelemetry plugin SSR-safe?

The plugin checks for a registered tracer provider via `trace.getTracer()`, which returns a no-op tracer during SSR since there's no browser context. Spans created during server-side rendering are silently dropped. Events only produce real spans in the browser after hydration.

### What happens to orphaned tour spans if the user closes the tab?

The `destroy` method ends in-progress tour spans with an error status. If the user closes the tab before `destroy` fires, the `BatchSpanProcessor` may not flush. Hook into the `visibilitychange` event to call `provider.forceFlush()` for more reliable delivery. Some span loss on tab close is expected for browser telemetry.
