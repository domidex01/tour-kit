---
title: "What is AGPL? Why license choice matters for open-source libraries"
slug: "what-is-agpl-license"
canonical: https://usertourkit.com/blog/what-is-agpl-license
tags: javascript, open-source, react, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-agpl-license)*

# What is AGPL? Why license choice matters for open-source libraries

You found a JavaScript library that does exactly what you need. Good star count, active maintenance, clean API. You run `npm install` and move on.

Three months later, your legal team flags it. The license is AGPL-3.0, and your SaaS product just became subject to source code disclosure requirements you didn't plan for. Not a hypothetical scenario. Of the roughly 2.7 million packages on npm as of April 2026, only around 4,200 use AGPL — but a single one in your dependency tree is enough to trigger obligations.

Understanding what the AGPL license actually requires takes five minutes. Those five minutes can save your team from a painful conversation later.

## Definition

The GNU Affero General Public License (AGPL-3.0) is a strong copyleft license published by the Free Software Foundation in 2007. It requires anyone who runs modified AGPL software over a network to make the complete source code available to users of that service. As of 2025, roughly 3% of open-source projects use AGPL, compared to 92% using permissive licenses like MIT ([2025 Synopsys OSSRA Report](https://www.synopsys.com/software-integrity/resources/analyst-reports/open-source-security-risk-analysis.html)).

AGPL was created to close a perceived loophole in the GPL. The regular GPL requires source code sharing only when you distribute binaries. SaaS companies could modify GPL code, run it on their servers, and never release their changes because they weren't distributing anything. AGPL's Section 13 closes that gap by treating network interaction as distribution.

## How AGPL works in practice

The core mechanism is straightforward. If you modify AGPL-licensed code and users interact with it over a network, you must offer those users access to your complete corresponding source code. "Complete" means everything needed to build and run the service.

Here's where it gets complicated for JavaScript developers.

When you `npm install` an AGPL package into a React app, your bundler (webpack, Vite, esbuild) combines that code with yours into a single output. Whether that creates a "derivative work" under AGPL is a legal question your engineering team can't answer. Lawyers disagree on it. And that uncertainty is the real problem.

| Scenario | AGPL obligation | Risk level |
|---|---|---|
| Running unmodified AGPL code as a separate service | Provide source of that service | Low |
| Modifying AGPL code deployed to users | Provide source of your modifications | Medium |
| Bundling AGPL code into your SaaS frontend | Possibly your entire frontend source | High (legally ambiguous) |
| Using AGPL code in a backend API your app calls | Provide source of that API service | Medium-High |

JavaScript delivered to a browser is effectively distributed code. The SaaS loophole that AGPL was designed to close doesn't even apply here. Your bundled JS ships to users' browsers, so you're distributing it in the traditional GPL sense too. According to a 2025 Black Duck audit report, 30% of license compliance conflicts originate from hidden transitive dependencies in `node_modules`.

## AGPL examples in the JavaScript ecosystem

Shepherd.js adopted AGPL-3.0 as part of a dual-licensing model. As of April 2026, Shepherd.js has roughly 13,000 GitHub stars and pulls around 120,000 weekly npm downloads. Compare that to React Joyride's 520,000+ weekly downloads under MIT — the license gap correlates with an adoption gap.

Google bans AGPL software company-wide. MongoDB originally used AGPL before creating the even more restrictive SSPL in 2018. Other AGPL projects: Nextcloud, Mastodon, Mattermost. These are standalone services, not libraries you embed into your application.

## Why AGPL matters when choosing dependencies

For library authors, AGPL limits your potential user base. A 2024 survey by Tidelift found that 62% of organizations have formal open-source license policies, and AGPL consistently appears on the "do not use" list. For library consumers, the question is simpler: can you explain to your legal team exactly what source code obligations you're accepting?

## License choice in the product tour ecosystem

When we built [Tour Kit](https://usertourkit.com/), we chose MIT licensing deliberately. A product tour library gets bundled directly into your application's frontend. AGPL would mean every SaaS company using Tour Kit might need to disclose their application source code.

```bash
# MIT-licensed: install without a legal review
npm install @tourkit/core @tourkit/react
```

React, Next.js, Tailwind CSS, Radix UI, and shadcn/ui all use MIT. The modern React stack chose permissive licensing because these libraries are designed to be embedded in commercial products.

## FAQ

### Is AGPL the same as GPL?

AGPL-3.0 extends GPL-3.0 with Section 13, the "network use" clause. Standard GPL triggers source code obligations only on binary distribution. AGPL triggers them when users interact over a network — covering every SaaS application.

### Can I use AGPL libraries in a commercial SaaS product?

Technically yes, but you must provide your complete corresponding source code. The definition of "corresponding source" for a bundled JavaScript application remains legally contested. Google bans all AGPL software from its codebase regardless of use case.

### Why does Shepherd.js use AGPL?

Shepherd.js uses AGPL-3.0 as a dual-licensing strategy. Commercial users purchase a proprietary license ($50 Business, $300 Enterprise as of April 2026). Even internal tools at for-profit companies require the commercial license.
