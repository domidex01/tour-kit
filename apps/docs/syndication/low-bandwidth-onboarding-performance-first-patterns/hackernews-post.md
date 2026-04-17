## Title: Onboarding in low-bandwidth environments: performance-first patterns

## URL: https://usertourkit.com/blog/low-bandwidth-onboarding-performance-first-patterns

## Comment to post immediately after:

Product tour "best practices" guides from the major vendors (Chameleon, Appcues, Intercom, Userpilot) all focus on UX: step count, segmentation, activation metrics. None address what happens when the tour SDK itself is the performance bottleneck.

Some findings from testing on simulated slow networks:

- Alex Russell's global baseline: 300–350 KB JS total per page. A typical SaaS tour SDK consumes that alone.
- A 300 KB SDK takes 2.4s on 3G, ~10s on Edge/2G. That's before parse and compile.
- React.lazy + Suspense cut TTI by 400 ms in our test (Slow 3G, 4x CPU slowdown).
- The Network Information API lets you conditionally skip images/animations on slow connections. No tour library documents this pattern.
- Injected tour SDKs silently damage INP and TBT (field CWV data catches it even when Lighthouse lab tests don't).

The article covers lazy loading, adaptive rendering, service worker caching strategies (Cache-First for JS chunks, Stale-While-Revalidate for step content), and a checklist of patterns that work on 3G.

I built Tour Kit (the library referenced), which ships at <8 KB gzipped core. But the performance patterns apply to any tour library or even custom implementations. The main point is that nobody in the onboarding space is talking about this.
