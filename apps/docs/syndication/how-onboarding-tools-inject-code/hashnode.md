---
title: "How SaaS onboarding tools inject their code (and why you should care)"
slug: "how-onboarding-tools-inject-code"
canonical: https://usertourkit.com/blog/how-onboarding-tools-inject-code
tags: react, javascript, web-development, performance, security
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/how-onboarding-tools-inject-code)*

# How SaaS onboarding tools inject their code (and why you should care)

Every major SaaS onboarding platform (Appcues, Pendo, WalkMe, Userpilot, Chameleon) follows the same integration pattern. You paste a `<script>` tag into your app's `<head>`. On every page load, that script fetches the vendor's full JavaScript bundle from their CDN, attaches DOM observers to find target elements by CSS selectors, renders overlay UI directly into your document, and sends analytics pings back to the vendor's servers. All of this happens outside your React component tree, outside your build pipeline, and outside your control.

As of April 2026, according to the [2025 Web Almanac](https://developer.chrome.com/blog/third-party-scripts), 92% of pages load at least one third-party resource. Third-party scripts account for 45.9% of all page requests on mobile.

We spent three weeks profiling onboarding tools during Tour Kit's architecture design phase. We measured network waterfalls, main thread blocking, and DOM mutation counts for five different SaaS onboarding platforms running on a Next.js test app.

*Full disclosure: I built [Tour Kit](https://tourkit.dev), an npm-installed onboarding library. Tour Kit requires React 18+ and has no visual editor.*

## The five-step injection sequence

Every CDN-injected onboarding tool follows this runtime sequence on every page load:

1. **Network request to vendor CDN** — DNS lookup + TCP + TLS handshake (100-300ms per [web.dev](https://web.dev/articles/third-party-javascript))
2. **Parse and execute the full bundle** — no tree-shaking for your usage
3. **DOM polling for element selectors** — querySelector calls on an interval
4. **Overlay injection** — DOM nodes inserted directly into document.body
5. **Analytics beacons** — HTTP requests back to vendor servers

## The performance cost

- Third-party scripts add 500-1,500ms to page load times on average ([DebugBear](https://www.debugbear.com/blog/reduce-the-impact-of-third-party-code))
- GTM with 18 tags increases Total Blocking Time nearly 20x ([Chrome Aurora](https://developer.chrome.com/blog/third-party-scripts))
- Case study: removing 63 third-party scripts improved LCP 29%, INP 48%, CLS 81%
- Vendor CDN outage can block rendering for 10-80 seconds ([web.dev](https://web.dev/articles/efficiently-load-third-party-javascript))

## The security risk

The Polyfill.io supply chain attack (100,000+ sites compromised) demonstrates the exact threat model that applies to any CDN-loaded onboarding script. Onboarding tools run on every page with full document-level access.

SRI doesn't work because vendors push silent CDN updates. CSP compatibility requires adding `unsafe-inline` or `unsafe-eval` exceptions.

npm-installed libraries solve this by design: pinned versions, lockfile, `npm audit`, zero CSP exceptions.

## Why overlays break

- **Selector fragility** — CSS selectors break when UI changes, with no build error or test failure
- **Shadow DOM** — querySelector can't reach encapsulated elements
- **Z-index conflicts** — injected overlays fight your modal stack

## CDN-injected vs. npm-installed

| Factor | CDN-injected | npm-installed |
|---|---|---|
| Delivery | CDN script every page load | Compiled into your bundle |
| Runtime cost | 100-300ms per domain | Zero additional requests |
| Bundle size | Full platform loaded | Tree-shaken: <8KB core |
| Updates | Silent CDN pushes | Pinned versions |
| Supply chain | Vendor CDN trust point | npm audit, lockfile |
| CSP | Requires exceptions | No exceptions needed |

## When SaaS injection makes sense

- No frontend engineering capacity
- Rapid experimentation without deploy cycles
- Legacy non-React codebases

Full article with all code examples: [usertourkit.com/blog/how-onboarding-tools-inject-code](https://usertourkit.com/blog/how-onboarding-tools-inject-code)
