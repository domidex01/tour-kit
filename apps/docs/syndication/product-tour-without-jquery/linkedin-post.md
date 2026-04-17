"Does this product tour library need jQuery?" is still a common question in 2026. The answer: no. Every maintained library dropped jQuery years ago.

The more interesting question is what actually differentiates these libraries now. I compared six options and found three things most articles miss:

1. Intro.js and Shepherd.js use AGPL v3 licensing. If you're shipping closed-source SaaS, you need a commercial license. Most comparison articles skip this entirely.

2. None of the six libraries fully implement W3C ARIA APG patterns for tour dialogs (focus trapping, aria-live regions, keyboard dismiss).

3. Tours breaking on SPA route changes is the #1 GitHub issue across multiple libraries, but zero roundup articles address it.

Bundle sizes range from under 8 KB (Tour Kit) to ~37 KB (React Joyride v3) gzipped. The unpacked sizes most articles report are misleading.

Full comparison with decision framework: https://usertourkit.com/blog/product-tour-without-jquery

#react #javascript #webdevelopment #opensource #productdevelopment
