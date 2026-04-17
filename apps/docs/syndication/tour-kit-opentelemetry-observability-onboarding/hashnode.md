---
title: "Tour Kit + OpenTelemetry: observability for onboarding flows"
slug: "tour-kit-opentelemetry-observability-onboarding"
canonical: https://usertourkit.com/blog/tour-kit-opentelemetry-observability-onboarding
tags: react, javascript, web-development, opentelemetry, observability
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-opentelemetry-observability-onboarding)*

# Tour Kit + OpenTelemetry: observability for onboarding flows

Product analytics tools tell you *what* happened. OpenTelemetry tells you *why*. When a user abandons your onboarding tour at step 3, PostHog shows a drop-off in a funnel chart. It can't tell you that the API call behind step 3 took 4.2 seconds, or that the tooltip rendered before the target element loaded.

OpenTelemetry (OTel) is the CNCF's vendor-neutral standard for traces, metrics, and logs. As of April 2026, `@opentelemetry/sdk-trace-web` pulls roughly 480K weekly downloads on npm, and the project has over 3,500 contributors. Enterprise teams already use it to trace API requests across services. Connecting those backend traces to frontend user experience is the missing piece.

This article walks through building a Tour Kit analytics plugin that converts tour events into OTel spans, giving you distributed tracing across your onboarding flows. About 60 lines of TypeScript.

Full article with all code examples: [usertourkit.com/blog/tour-kit-opentelemetry-observability-onboarding](https://usertourkit.com/blog/tour-kit-opentelemetry-observability-onboarding)
