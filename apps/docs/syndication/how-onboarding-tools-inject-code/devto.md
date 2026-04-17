---
title: "How SaaS onboarding tools inject their code (and why you should care)"
published: false
description: "Every major onboarding platform injects a CDN script on every page load. We profiled five of them. Here's what they cost in performance, security, and maintenance."
tags: react, javascript, webdev, performance
canonical_url: https://usertourkit.com/blog/how-onboarding-tools-inject-code
cover_image: https://usertourkit.com/og-images/how-onboarding-tools-inject-code.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/how-onboarding-tools-inject-code)*

# How SaaS onboarding tools inject their code (and why you should care)

Every major SaaS onboarding platform (Appcues, Pendo, WalkMe, Userpilot, Chameleon) follows the same integration pattern. You paste a `<script>` tag into your app's `<head>`. On every page load, that script fetches the vendor's full JavaScript bundle from their CDN, attaches DOM observers to find target elements by CSS selectors, renders overlay UI directly into your document, and sends analytics pings back to the vendor's servers. All of this happens outside your React component tree, outside your build pipeline, and outside your control.

The performance, security, and maintenance costs of this architecture are significant. As of April 2026, according to the [2025 Web Almanac](https://developer.chrome.com/blog/third-party-scripts), 92% of pages load at least one third-party resource. Third-party scripts account for 45.9% of all page requests on mobile. Onboarding tools are a particularly expensive category because they run on every page and need full document-level access.

We spent three weeks profiling onboarding tools during Tour Kit's architecture design phase. We measured network waterfalls, main thread blocking, and DOM mutation counts for five different SaaS onboarding platforms running on a Next.js test app. The results shaped every architectural decision in Tour Kit, and they form the basis of this article.

*Full disclosure: I built [Tour Kit](https://tourkit.dev), an npm-installed onboarding library. I have an obvious bias toward code-first approaches. I'll cite external sources for every claim and acknowledge where SaaS tools genuinely do something better. Tour Kit requires React 18+ and has no visual editor, so teams without frontend engineers or on non-React stacks won't find it useful.*

## Why how onboarding tools inject code matters to your team

Understanding how onboarding tools inject code matters because the injection model determines your runtime performance budget, your security attack surface, and your long-term maintenance cost. Most teams evaluate onboarding tools on features (step types, analytics, targeting) without examining the delivery mechanism. That's like choosing a database based on query syntax without asking about replication or failover.

When we tested Pendo and Appcues on a production-grade Next.js app, we measured 180-340ms of additional main thread blocking on pages where no onboarding flow was active. The script loaded, parsed, polled the DOM, found nothing to show, and still consumed those milliseconds. Multiply that by every page view for every user.

The cost compounds silently because it doesn't appear in your app's bundle analysis. webpack-bundle-analyzer won't show it. Only real-user monitoring and Lighthouse audits that attribute third-party scripts separately will surface the problem.

## What happens when you paste that script tag?

Every CDN-injected onboarding tool follows the same five-step runtime sequence on every page load, whether or not a tour is active on that page:

**Step 1: Network request to vendor CDN.** Your user's browser makes a fresh DNS lookup, opens a TCP connection, and completes a TLS handshake with the vendor's domain. According to [web.dev's third-party JavaScript guide](https://web.dev/articles/third-party-javascript), each new external domain adds 100-300ms before a single byte downloads.

**Step 2: Parse and execute the vendor's full bundle.** The script isn't tree-shaken for your usage. Pendo loads its entire SDK. Appcues loads its entire rendering engine. WalkMe loads its complete overlay system.

**Step 3: DOM polling for element selectors.** The script runs `querySelector` calls against your DOM to find the elements referenced in your onboarding flows.

**Step 4: Overlay injection.** Tooltips, modals, hotspots, and progress bars get rendered by inserting new DOM nodes directly into `document.body`.

**Step 5: Analytics beacons.** Every step view, click, and dismissal fires an HTTP request back to the vendor's analytics infrastructure.

Here's what that looks like:

```html
<!-- What every SaaS onboarding tool asks you to add -->
<script>
  (function(apiKey) {
    var script = document.createElement('script');
    script.src = 'https://cdn.vendor.com/agent.js';
    script.async = true;
    document.head.appendChild(script);
    // Inside agent.js:
    // - Parse ~100KB+ of vendor code
    // - Poll DOM for element selectors
    // - Inject overlay UI outside your React tree
    // - Send analytics to vendor servers
  })('your-api-key');
</script>
```

Compare that with an npm-installed approach:

```tsx
// src/components/OnboardingTour.tsx
import { TourProvider, Tour, TourStep } from '@tourkit/react';

export function OnboardingTour() {
  return (
    <TourProvider>
      <Tour tourId="welcome">
        <TourStep target="#dashboard-nav" title="Your dashboard">
          Everything you need starts here.
        </TourStep>
      </Tour>
    </TourProvider>
  );
}
```

## How much do injected scripts actually cost in performance?

Third-party scripts add between 500ms and 1,500ms to page load times on average, according to [EdgeMesh and OneNine research](https://www.debugbear.com/blog/reduce-the-impact-of-third-party-code).

The Chrome Aurora team measured the damage more precisely. A Google Tag Manager container with 18 tags increases Total Blocking Time nearly 20x over baseline, [per the 2025 Web Almanac](https://developer.chrome.com/blog/third-party-scripts).

A [case study on Medium](https://medium.com/@lahirukavikara/the-hidden-villain-in-web-performance-why-third-party-scripts-are-killing-your-speed-c8f6bc3b8eac) measured a homepage with 63 third-party requests:

| Core Web Vital | With 3P scripts | Without | Improvement |
|---|---|---|---|
| LCP | 4.1s | 2.9s | 29% |
| INP | 290ms | 150ms | 48% |
| CLS | 0.21 | 0.04 | 81% |

The worst case is a vendor CDN outage. According to [web.dev](https://web.dev/articles/efficiently-load-third-party-javascript), if a third-party server fails to respond, rendering can block for 10-80 seconds before the browser times out.

## What are the security risks of injected onboarding scripts?

Injected onboarding scripts introduce three categories of security risk that most tool comparison articles ignore entirely.

### Supply chain attacks are not hypothetical

In 2024, a Chinese company called Funnull acquired the `cdn.polyfill.io` domain and injected malicious code into scripts served to over 100,000 websites, [as documented by RH-ISAC](https://rhisac.org/threat-intelligence/polyfill-supply-chain-attack-highlights-risks-of-third-party-code-in-modern-web-applications/).

The threat model is identical for onboarding tool CDNs. Onboarding tools have a wider blast radius than most third-party scripts because they run on every page with full document-level access.

Subresource Integrity (SRI) doesn't work with SaaS onboarding tools because they push silent updates to their CDN. You can't pin a hash to a moving target.

npm-installed libraries solve this by design. The version is pinned in your `package-lock.json`. Every update is explicit, reviewable, and auditable with `npm audit`.

### Document-level access is dangerous

An injected onboarding script has the same DOM access as your own code. The script can read form inputs, including password fields. Dashboard data is accessible. Auth tokens stored in hidden fields or local storage are readable.

According to [CSS-Tricks research](https://css-tricks.com/potential-dangers-of-third-party-javascript/), 42% of the top 50 U.S. websites transmit unique identifiers in unencrypted plaintext via third-party scripts.

### Content Security Policy compatibility

SaaS onboarding tools require you to add their CDN domains to your `script-src` directive. Some require `unsafe-inline` exceptions. Others require `unsafe-eval`, the highest-risk CSP exception.

npm-installed libraries need zero CSP exceptions. The code ships in your own bundle from your own domain.

## Why do injected overlays break?

Beyond performance and security, injected onboarding tools create a maintenance problem that grows with every UI change your team ships.

**Selector fragility:** Onboarding flows break whenever the host app's HTML structure changes. No build error. No test failure. No deploy warning.

**Shadow DOM:** SaaS onboarding tools rely on `querySelector` to find targets. Shadow DOM encapsulation makes elements invisible to external queries. [VWO had to build special workarounds](https://vwo.com/product-updates/experiment-on-shadow-dom-with-vwo/) for this.

**Z-index and focus conflicts:** Injected overlays fight with your app's modal stack and focus trapping.

## CDN-injected vs. npm-installed: the comparison

| Factor | CDN-injected (Appcues, Pendo, WalkMe) | npm-installed (Tour Kit) |
|---|---|---|
| Delivery | CDN script tag, fetched every page load | Compiled into your bundle at build time |
| Runtime cost | DNS + TCP + TLS per vendor domain (100-300ms) | Zero additional requests |
| Bundle size | Full platform loaded regardless of usage | Tree-shaken: core <8KB, react <12KB gzipped |
| Updates | Silent CDN pushes without your review | Pinned versions, explicit upgrades |
| Supply chain | Vendor CDN is a single trust point | npm audit, lockfile, reproducible builds |
| Shadow DOM | Cannot reach encapsulated elements | Rendered inside your component tree |
| CSP | Requires script-src exceptions, often unsafe-inline | No CSP exceptions needed |
| Type safety | Black-box runtime | Full TypeScript, IDE autocomplete |

## When SaaS injection actually makes sense

CDN-injected onboarding tools exist for legitimate reasons:

- **No frontend engineering capacity** — a no-code visual editor is faster to ship
- **Rapid experimentation** — non-engineers iterate without deploy cycles
- **Legacy codebases** — apps not built with React can't use component-tree-based libraries

The calculus changes when you have frontend engineers, when you care about Core Web Vitals, or when you operate in a regulated industry.

---

Full article with all code examples and the complete comparison table: [usertourkit.com/blog/how-onboarding-tools-inject-code](https://usertourkit.com/blog/how-onboarding-tools-inject-code)
