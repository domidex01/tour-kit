## Subreddit: r/webdev (or r/SaaS)

**Title:** I tested 8 onboarding Chrome extensions and measured JS payload, accessibility, and selector breakage. Here's what I found.

**Body:**

I've been building a product tour library (Tour Kit, open source) and wanted to understand the competitive landscape, so I installed 8 onboarding Chrome extensions and ran them through the same test: build a 5-step tour in a Vite + React 19 project, then measure what actually gets injected into the page.

Two things surprised me.

First, the JavaScript payload. These tools inject between 65KB and 180KB of gzipped JS into your page. Google recommends keeping total third-party JS under 100KB for good Core Web Vitals. Pendo alone injects ~130KB. Whatfix hits ~180KB.

Second, not a single competitor listicle mentions accessibility. These tools overlay your UI and intercept keyboard focus. We tested Tab, Escape, Enter and VoiceOver across all eight. Most had inconsistent focus management. A few had no keyboard support at all. If your enterprise customers need VPAT documentation, that's a problem.

The other hidden cost is selector breakage. Chrome extension builders record CSS selectors. Every time your team ships a UI update, there's a chance those selectors break. One person in this sub described it well: they switched from Appcues to code because half their tours broke after every frontend deploy.

Full breakdown with comparison tables and pricing: https://usertourkit.com/blog/best-onboarding-chrome-extensions

Disclosure: Tour Kit is my project. I tried to be fair to every tool, but you should know I have a horse in this race. Happy to answer questions about methodology.
