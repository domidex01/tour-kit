# How SaaS Onboarding Tools Inject Their Code (And Why You Should Care)

## The hidden performance, security, and maintenance costs of script-tag onboarding

*Originally published at [usertourkit.com](https://usertourkit.com/blog/how-onboarding-tools-inject-code)*

Every major SaaS onboarding platform follows the same integration pattern. You paste a script tag into your app's head. On every page load, that script fetches the vendor's full JavaScript bundle from their CDN, attaches DOM observers, renders overlay UI directly into your document, and sends analytics pings back to the vendor's servers.

As of April 2026, 92% of pages load at least one third-party resource. Third-party scripts account for 45.9% of all page requests on mobile. Onboarding tools are a particularly expensive category because they run on every page and need full document-level access.

We spent three weeks profiling five different SaaS onboarding platforms running on a Next.js test app. The results were eye-opening.

*Disclosure: I built Tour Kit, an npm-installed onboarding library. I'll cite external sources for every claim.*

---

## The five-step injection sequence

Every CDN-injected onboarding tool follows this runtime sequence:

**Step 1:** Network request to vendor CDN. Each new external domain adds 100-300ms before a single byte downloads (web.dev).

**Step 2:** Parse and execute the full bundle. No tree-shaking. You get the entire SDK whether you're showing a tour or not.

**Step 3:** DOM polling for element selectors. The script runs querySelector calls on an interval.

**Step 4:** Overlay injection. DOM nodes inserted directly into document.body, outside your component tree.

**Step 5:** Analytics beacons. HTTP requests back to vendor servers on every interaction.

---

## The performance cost

Third-party scripts add 500-1,500ms to page load times on average (EdgeMesh/OneNine research). A Google Tag Manager container with 18 tags increases Total Blocking Time nearly 20x (Chrome Aurora team, 2025 Web Almanac).

A case study measured a homepage with 63 third-party requests: removing them improved LCP by 29% (4.1s to 2.9s), INP by 48% (290ms to 150ms), and CLS by 81%.

The worst case: if a vendor CDN fails to respond, rendering can block for 10-80 seconds before the browser times out.

---

## The security risk nobody talks about

In 2024, a company acquired the cdn.polyfill.io domain and injected malicious code into scripts served to over 100,000 websites. The threat model is identical for onboarding tool CDNs: they run on every page with full document-level access.

Subresource Integrity (SRI) doesn't work because vendors push silent updates. Content Security Policy compatibility requires adding unsafe-inline or unsafe-eval exceptions.

42% of the top 50 U.S. websites already transmit unique identifiers in unencrypted plaintext via third-party scripts (CSS-Tricks research).

---

## Why overlays break

Injected onboarding tools find elements by CSS selectors recorded during flow creation. These selectors break when the UI changes. No build error. No test failure. Someone reports it weeks later.

Shadow DOM makes it worse. External querySelector calls can't reach elements inside shadow boundaries. VWO had to build special workarounds just for this.

---

## The alternative: npm-installed libraries

npm-installed libraries run inside your component tree. No extra network request. No DOM polling. No overlay injection. The code is compiled into your bundle, tree-shaken, version-pinned, and auditable.

SaaS injection still makes sense when you have no frontend engineering capacity, need rapid experimentation without deploys, or work on a legacy non-React codebase.

The calculus changes when you have frontend engineers, care about Core Web Vitals, or operate in a regulated industry.

---

*Full article with code examples, comparison table, and audit instructions: usertourkit.com/blog/how-onboarding-tools-inject-code*

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, Bits and Pieces
