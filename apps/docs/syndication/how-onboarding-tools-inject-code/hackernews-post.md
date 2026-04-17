## Title: How SaaS onboarding tools inject their code, and what it costs in performance and security

## URL: https://usertourkit.com/blog/how-onboarding-tools-inject-code

## Comment to post immediately after:

I profiled five SaaS onboarding platforms (Appcues, Pendo, WalkMe, Userpilot, Chameleon) running on a Next.js test app. All five follow the same architecture: CDN script tag, DOM polling for element selectors, overlay injection into document.body, analytics beacons. On every page load, whether or not a tour is active.

The performance numbers: 180-340ms of main thread blocking on idle pages. Each vendor domain adds 100-300ms for DNS/TCP/TLS (per web.dev). The Chrome Aurora team found that GTM with 18 tags increases Total Blocking Time nearly 20x.

The security angle is underreported. These tools can't use Subresource Integrity because they push silent CDN updates. Some require unsafe-inline or unsafe-eval CSP exceptions. The Polyfill.io supply chain attack (100k sites compromised via CDN takeover) demonstrates the identical threat model. Onboarding tools have wider blast radius because they run on every page with full document-level DOM access.

I'm building an npm-installed alternative (Tour Kit), so I have a clear bias. The article cites web.dev, Chrome Aurora team data, CSS-Tricks research (42% of top 50 US sites leaking identifiers via 3P scripts), Smashing Magazine, and DebugBear. I also acknowledge three scenarios where CDN injection is the right choice.
