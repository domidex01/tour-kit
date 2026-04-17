# Onboarding in Low-Bandwidth Environments: What Most Product Tour Guides Miss

## Your onboarding SDK might be the thing killing your onboarding

*Originally published at [usertourkit.com](https://usertourkit.com/blog/low-bandwidth-onboarding-performance-first-patterns)*

A 5 MB JavaScript file takes 40 seconds to download on a 3G connection. If your onboarding depends on that download, users on slow networks never see a single tour step.

I've been building Tour Kit, a headless product tour library for React. The core ships at under 8 KB gzipped. While working on performance testing, I realized something: every "product tour best practices" guide from the major vendors talks about step count, segmentation, and activation metrics. Not one of them addresses what happens when the tour SDK itself is the bottleneck.

This matters more than you'd think. Alex Russell's global baseline gives you roughly 300–350 KB of compressed JavaScript total for a page. A SaaS tour SDK can consume that budget alone. On 3G, a 300 KB SDK takes 2.4 seconds just to download, before any tour step renders.

## The patterns that actually work

**Lazy load your tour library.** Product tours trigger conditionally. There's no reason to include the tour bundle in the initial page load. React.lazy and Suspense defer the download until the user actually needs onboarding. The Calibre blog documented a 30% improvement in Time to Interactive using this pattern.

**Read the network before rendering.** The Network Information API lets you detect connection speed at runtime. On slow connections, skip images and serve text-only tour steps. No broken layout, no spinner that never resolves.

**Cache tour assets with a service worker.** When a user opens your app on a flaky connection mid-tour, a CDN-delivered SaaS tour SDK breaks. A service-worker-cached tour continues. Jeffrey Zeldman put it well: "Offline First is the new progressive enhancement."

**Understand the hidden SEO cost.** Injected tour SDKs damage your Core Web Vitals scores. A third-party tour script that blocks the main thread tanks INP and TBT without appearing in LCP. Your Lighthouse score looks fine. Your search rankings suffer anyway.

## The 7-point checklist

After testing on throttled Chrome DevTools (Slow 3G, 4x CPU slowdown) with a Vite + React 19 project:

1. Ship under 50 KB for the tour chunk
2. Defer initialization with React.lazy
3. Use `navigator.connection.effectiveType` to skip media on slow networks
4. Pre-cache the tour chunk with a service worker
5. Keep steps to 25 words (analysis of 58 million tours confirms this)
6. Respect `prefers-reduced-motion`
7. Avoid SaaS-injected scripts entirely

An honest caveat: Tour Kit requires React 18+ and TypeScript knowledge. No visual builder. If your team needs drag-and-drop editing and doesn't care about bundle size, a SaaS tool might be the better fit. But if your users are on slow connections, you need the control that headless libraries provide.

Full article with all code examples, comparison tables, and service worker patterns: [usertourkit.com/blog/low-bandwidth-onboarding-performance-first-patterns](https://usertourkit.com/blog/low-bandwidth-onboarding-performance-first-patterns)

---

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, Bits and Pieces
