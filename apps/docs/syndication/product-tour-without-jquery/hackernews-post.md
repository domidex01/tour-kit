## Title: jQuery-free product tour libraries compared: bundle size, licensing, and accessibility (2026)

## URL: https://usertourkit.com/blog/product-tour-without-jquery

## Comment to post immediately after:

I wrote this after noticing that "product tour without jQuery" is still a common search query, even though every maintained library dropped jQuery years ago. The more interesting story is what actually differentiates these libraries now.

Two findings I didn't expect: (1) Intro.js and Shepherd.js use AGPL v3, which most comparison articles don't flag as a concern for closed-source SaaS teams. (2) None of the six libraries I tested implement the full W3C ARIA APG patterns for dialog-style tours (focus trapping, aria-live regions, keyboard dismiss).

The gzip vs. unpacked size distinction is another thing roundups consistently get wrong. React Joyride's 711 KB unpacked size sounds alarming, but the real gzip transfer impact is ~37 KB. Intro.js at ~10 KB gzipped is genuinely tiny.

Disclosure: I built one of the libraries compared (Tour Kit). I tried to be fair about tradeoffs, including acknowledging Tour Kit's limitations (React 18+ only, no visual builder, smaller community).
