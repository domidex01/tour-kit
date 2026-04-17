## Subreddit: r/reactjs

**Title:** I compared 6 product tour libraries for React — every one is jQuery-free now, but the real differences surprised me

**Body:**

I've been researching product tour libraries for a React project and realized the "does it need jQuery?" question is outdated. Every maintained library dropped jQuery years ago. Bootstrap Tour and Trip.js still depend on it, but both are effectively abandoned.

The more interesting findings were around licensing and accessibility. Intro.js and Shepherd.js use AGPL v3, which means if you're building closed-source SaaS you need a commercial license. Most roundup articles don't mention this. Driver.js, Reactour, React Joyride, and Tour Kit are all MIT.

On accessibility, I tested focus trapping and aria-live region support across all six. Most libraries provide basic aria-describedby attributes but don't implement the W3C ARIA APG patterns for dialogs (focus trap, keyboard dismiss with Escape, live region announcements for dynamic content). That was a gap I wasn't expecting.

Bundle sizes in gzipped (not unpacked, which is misleading):
- Tour Kit core: <8 KB
- Intro.js: ~10 KB
- Reactour: ~15 KB
- Driver.js: ~25 KB
- Shepherd.js: ~35 KB
- React Joyride v3: ~37 KB

The biggest real-world pain point I found: tours breaking on SPA route changes. It's the #1 GitHub issue across Shepherd, Joyride, and Driver.js. None of the comparison articles I found address it.

Disclosure: I built Tour Kit, so take the comparison with appropriate skepticism. All numbers are verifiable on npm and Bundlephobia.

Full write-up with comparison table and code examples: https://usertourkit.com/blog/product-tour-without-jquery
