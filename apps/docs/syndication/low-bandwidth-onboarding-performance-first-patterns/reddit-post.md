## Subreddit: r/reactjs (primary), r/webdev (secondary)

**Title:** What happens when your product tour SDK meets a 3G connection? I tested the performance patterns that actually work.

**Body:**

I've been working on a headless product tour library and got curious about what happens to onboarding flows on slow networks. Turns out, every "product tour best practices" article from the major vendors (Chameleon, Appcues, Intercom) focuses on UX patterns like step count and segmentation. None of them address the elephant in the room: the SDK itself is often the performance bottleneck.

Some numbers that surprised me: Alex Russell's global baseline gives you 300–350 KB of compressed JS for an entire page. React Joyride ships at 498 KB unpacked. A typical SaaS tour SDK is 300 KB+, which takes 2.4 seconds to download on 3G before any tour step even renders. On 2G/Edge? Nearly 10 seconds.

The patterns that moved the needle in my testing (Slow 3G preset, 4x CPU slowdown, Vite + React 19):

- **React.lazy + Suspense** for the tour library itself. Tours trigger conditionally, so there's no reason to include them in the initial bundle. This alone cut TTI by 400 ms.
- **Network Information API** to conditionally skip images/animations on slow connections. A 15-line `useConnectionSpeed()` hook that no tour library documents.
- **Service worker caching** with Cache-First for the tour JS chunk and Stale-While-Revalidate for step content.
- **Keeping the tour library under 20 KB gzipped**. Parse time matters too, since 300 KB compressed = 900 KB–1.3 MB on device.

I also found that injected tour SDKs silently tank your INP and TBT scores without appearing in LCP. Field data (Chrome UX Report) catches it even when Lighthouse doesn't.

Full writeup with all code examples, a comparison table of library download times on different networks, and a 7-point checklist: https://usertourkit.com/blog/low-bandwidth-onboarding-performance-first-patterns

Disclosure: I built Tour Kit (the library referenced). But the patterns apply regardless of which tour library you use.
