A 300 KB onboarding SDK takes 2.4 seconds to download on 3G. Before any tour step renders.

I dug into what happens when product tour libraries meet slow networks. Every best practices guide from the major vendors focuses on UX patterns. None address the performance bottleneck sitting in their own SDKs.

Alex Russell's global JS budget: 300–350 KB total per page. A single SaaS tour SDK can consume that entire budget.

The patterns that actually work on constrained networks:

- React.lazy to defer the tour bundle until the user triggers onboarding (cut TTI by 400 ms in testing)
- Network Information API to conditionally skip media on 2G/3G connections
- Service worker caching so returning users get instant tour loads from disk
- Keeping the tour library under 20 KB gzipped so parse time doesn't block the main thread

For teams building products targeting emerging markets, mobile-first audiences, or enterprise users behind restrictive proxies, this isn't a nice-to-have. It determines whether your onboarding works at all.

Full guide with code examples and a 7-point checklist: https://usertourkit.com/blog/low-bandwidth-onboarding-performance-first-patterns

#react #javascript #webperformance #productdevelopment #opensource
