## Thread (6 tweets)

**1/** A 5 MB JS file takes 40 seconds on 3G. Every product tour "best practices" guide talks about step count and segmentation. None talk about what happens when the SDK itself never loads.

I tested the patterns that actually work on slow networks:

**2/** Pattern 1: Lazy load your tour library. Tours trigger conditionally, so why include them in the initial bundle?

React.lazy + Suspense cut TTI by 400 ms on Slow 3G in our tests. The Calibre blog documented a 30% TTI improvement using the same pattern.

**3/** Pattern 2: Read the network before rendering. The Network Information API lets you detect 2G/3G at runtime and skip images.

15 lines of code. No tour library documents this. But Tour Kit's headless architecture makes it trivial since you control the rendering.

**4/** The hidden cost nobody talks about: injected tour SDKs tank your INP and TBT scores without appearing in LCP.

Your Lighthouse score looks fine. Your field CWV data (what Google actually uses for ranking) tells a different story.

**5/** Alex Russell's global JS budget: 300–350 KB total per page.

Tour Kit core: 8 KB gzipped
Driver.js: ~15 KB
React Joyride: 498 KB unpacked
SaaS SDK: 300 KB+

On 3G, that's the difference between 0.06s and 2.4s before a single tour step renders.

**6/** Full guide with code examples, comparison tables, service worker caching strategies, and a 7-point checklist:

https://usertourkit.com/blog/low-bandwidth-onboarding-performance-first-patterns

(I built Tour Kit. The patterns apply to any tour library.)
