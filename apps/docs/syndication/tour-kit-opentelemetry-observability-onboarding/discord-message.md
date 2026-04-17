## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote up how to turn product tour events into OpenTelemetry distributed traces. If your team runs OTel for backend tracing, this plugin connects frontend onboarding flows to the same trace pipeline --- so when a user abandons step 3, you see the exact API call that caused it. ~60 lines of TypeScript, works with Jaeger/Tempo/Honeycomb.

https://usertourkit.com/blog/tour-kit-opentelemetry-observability-onboarding

Anyone else doing frontend OTel instrumentation for user flows? Curious what your setup looks like.
