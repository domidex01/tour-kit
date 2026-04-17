## Subreddit: r/reactjs

**Title:** I profiled 5 SaaS onboarding tools on a Next.js app — here's what they actually cost in performance

**Body:**

I spent three weeks profiling Appcues, Pendo, WalkMe, Userpilot, and Chameleon during the design phase of a React onboarding library I'm building. All five follow the same pattern: CDN script tag in your head, DOM polling for element selectors, overlay injection into document.body, analytics pings back to vendor servers. On every page load. Even when no tour is active.

The numbers that surprised me most:

- 180-340ms of main thread blocking on pages with zero active flows
- Each vendor domain adds 100-300ms just for DNS/TCP/TLS before any code downloads (per web.dev)
- A case study removing 63 third-party scripts improved INP by 48% and LCP by 29%
- If the vendor CDN goes down, rendering blocks for 10-80 seconds until browser timeout

The security angle was even more interesting. None of these tools support Subresource Integrity because they push silent CDN updates. Some require unsafe-inline or unsafe-eval CSP exceptions. The Polyfill.io supply chain attack (100k sites compromised) is the exact same threat model — a CDN serving JavaScript to your users that you don't control.

The Shadow DOM problem was new to me. These tools all use querySelector to find target elements, but shadow DOM encapsulation makes elements invisible to external queries. VWO had to build special workarounds for it.

I wrote up the full analysis with code examples showing the difference between CDN-injected and npm-installed approaches, a comparison table, and instructions for auditing your own third-party script cost in Chrome DevTools.

Full article: https://usertourkit.com/blog/how-onboarding-tools-inject-code

Disclosure: I'm building Tour Kit, an npm-installed alternative. The article cites web.dev, Chrome Aurora team data, CSS-Tricks, Smashing Magazine, and DebugBear for all performance/security claims.
