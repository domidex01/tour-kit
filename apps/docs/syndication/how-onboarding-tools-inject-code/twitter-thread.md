## Thread (6 tweets)

**1/** Every SaaS onboarding tool (Appcues, Pendo, WalkMe) injects a CDN script on every page load. Even when no tour is active, it still does DNS lookup, DOM polling, overlay setup, and analytics pings.

We profiled 5 of them. Here's what they actually cost:

**2/** Performance: 180-340ms of main thread blocking on pages with ZERO active flows.

The Chrome Aurora team found GTM with 18 tags increases Total Blocking Time ~20x. Onboarding scripts are worse because they poll the DOM continuously.

**3/** Security: These tools can't use Subresource Integrity because they push silent CDN updates.

Remember Polyfill.io? 100k sites compromised via CDN takeover. Same threat model applies to every CDN-loaded onboarding script running with full document access.

**4/** Maintenance: Onboarding flows use CSS selectors to find elements. Refactor a component? Flows silently break. No build error. No test failure. Someone reports it weeks later.

Shadow DOM makes it worse — querySelector can't reach encapsulated elements at all.

**5/** The alternative: npm-installed libraries that compile into your bundle.

No extra DNS lookup. Tree-shaken. Version-pinned. Zero CSP exceptions. Part of your React tree instead of a parallel DOM observer.

**6/** Full breakdown with performance data, security analysis, comparison table, and Chrome DevTools audit instructions:

https://usertourkit.com/blog/how-onboarding-tools-inject-code

(Disclosure: I'm building Tour Kit, an npm-installed alternative. All claims cite web.dev, Chrome Aurora, CSS-Tricks, and DebugBear.)
