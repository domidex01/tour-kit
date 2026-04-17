## Thread (6 tweets)

**1/** "Product tour without jQuery" is still a top search query in 2026. But here's the thing: every maintained library dropped jQuery years ago. The real differences are way more interesting.

**2/** The licensing trap nobody talks about: Intro.js and Shepherd.js use AGPL v3. Building closed-source SaaS? You need a commercial license. Driver.js, Reactour, React Joyride, and Tour Kit are all MIT.

**3/** Gzipped bundle sizes (not the misleading unpacked numbers):
- Tour Kit: <8 KB
- Intro.js: ~10 KB
- Reactour: ~15 KB
- Driver.js: ~25 KB
- Shepherd.js: ~35 KB
- React Joyride v3: ~37 KB

**4/** The accessibility gap surprised me most. The W3C ARIA APG specifies focus trapping, aria-live regions, and keyboard dismiss for tour dialogs. Most libraries provide basic aria-describedby and stop there.

**5/** Biggest real-world pain point across ALL libraries: tours breaking on SPA route changes. It's the #1 GitHub issue for Shepherd, Joyride, and Driver.js. Zero comparison articles mention it.

**6/** Full comparison with code examples and decision framework: https://usertourkit.com/blog/product-tour-without-jquery

(Disclosure: I built Tour Kit, one of the compared libraries. All numbers verifiable on npm/Bundlephobia.)
