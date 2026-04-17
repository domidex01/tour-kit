## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote a tutorial on adding typed custom analytics events to product tours in React. The pattern uses TypeScript discriminated unions on the event metadata field so you get compile-time checking for different interaction types (CTA clicks, video plays, form submissions). Zero bundle overhead since the types compile away.

Also covers building a custom analytics plugin with batching + `navigator.sendBeacon` for reliable delivery on page close.

https://usertourkit.com/blog/custom-events-tour-analytics-react

Would appreciate feedback on the plugin interface design if anyone has experience with analytics abstraction layers.
