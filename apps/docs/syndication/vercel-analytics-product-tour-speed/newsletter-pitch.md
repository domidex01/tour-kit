## Subject: How product tours affect Core Web Vitals (measured with Vercel Speed Insights)

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

We measured how adding a product tour to a Next.js dashboard affects Core Web Vitals using Vercel Speed Insights — CLS jumped from 0.04 to 0.12 on mobile from a single tooltip animation. The article covers how to wire tour lifecycle events to Vercel Analytics custom events and use Speed Insights' `beforeSend` callback to tag performance data with tour context for per-route A/B comparison.

Practical integration guide with TypeScript code (50 lines across 3 files), a CWV impact risk table by metric, and advanced patterns like sampleRate tuning and VES deployment gates.

Link: https://usertourkit.com/blog/vercel-analytics-product-tour-speed

Thanks,
Domi
