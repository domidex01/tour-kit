Only 28% of product tours result in the target feature being used within 7 days.

The typical analytics setup tells you tour completion rates and step drop-off. It doesn't tell you what happened inside each step — did users click the upgrade CTA? Watch the video? Submit the form?

I wrote a tutorial on adding typed custom events to React product tours using TypeScript discriminated unions and a plugin architecture that routes to any analytics backend.

The approach:
- Define metadata schemas per interaction type (CTA clicks, video plays, form submissions)
- Wrap the analytics API with typed helpers (4-8 lines each, zero bundle cost)
- Build a custom plugin with batching and sendBeacon for reliable delivery
- Fire events from tour step components through a React hook

Each event payload is ~200 bytes. A 5-step tour generates ~15 events total. The types compile away, so the runtime cost is under 0.1ms per event.

Full tutorial with 6 working code examples: https://usertourkit.com/blog/custom-events-tour-analytics-react

#react #typescript #analytics #productdevelopment #webdevelopment
