## Subreddit: r/reactjs

**Title:** I wrote a developer-focused definition of "product tour" — covering the state machine, positioning engine, and why most libraries fail on accessibility

**Body:**

I got tired of every "what is a product tour" article being written by marketing teams selling SaaS tools, so I wrote a developer-focused definition that covers how tours actually work technically.

The short version: a product tour is a UI state machine that runs through four stages on every step — target resolution (find the DOM element), positioning (anchor the tooltip accounting for viewport edges), overlay rendering (spotlight cutout), and focus management (keyboard trapping for a11y). Most libraries handle the first three well but skip the fourth entirely, which breaks WCAG 2.1 compliance.

Some data points from Chameleon's analysis of 15 million tour interactions:
- 3-step tours: 72% completion
- 7-step tours: 16% completion
- User-initiated tours: 67% vs delay-triggered: 31%

The article covers the four tour patterns (action-driven tooltips, passive walkthroughs, hotspots, announcement modals), when to use each, and includes a minimal React code example showing how a headless tour library works.

Full article with the comparison table and code: https://usertourkit.com/blog/what-is-a-product-tour

Disclosure: I built Tour Kit, which is mentioned in the article. The definition and data apply regardless of which library you use.
