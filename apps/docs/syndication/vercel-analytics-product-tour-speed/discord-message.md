## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote up how to measure the Core Web Vitals impact of product tours using Vercel Analytics + Speed Insights. Found that a single tooltip animation pushed CLS from 0.04 to 0.12 on mobile. The `beforeSend` callback on `<SpeedInsights />` is useful for tagging performance data with tour context — lets you compare CWV for tour sessions vs. non-tour sessions on the same route.

https://usertourkit.com/blog/vercel-analytics-product-tour-speed

Would appreciate feedback on the `beforeSend` URL-tagging approach — curious if anyone has a cleaner way to segment speed data by UI state.
