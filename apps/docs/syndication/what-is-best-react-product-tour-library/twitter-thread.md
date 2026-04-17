## Thread (6 tweets)

**1/** I benchmarked 7 React tour libraries on bundle size, React 19 support, and accessibility.

The biggest surprise: the two most popular options are broken on React 19.

**2/** React Joyride has 400K+ weekly downloads but hasn't published an npm release in ~9 months. No React 19 support.

Shepherd's React wrapper? Also broken on React 19.

If you're starting a new project today, your options are more limited than you'd expect.

**3/** Accessibility scores (axe-core violations):

Tour Kit: 0
Shepherd: 2
React Joyride: 3
Driver.js: 4
Intro.js: 7

Most libraries treat a11y as an afterthought. Intro.js still uses links as buttons with no focus trap.

**4/** Bundle sizes (gzipped):

Driver.js: ~5 KB (no React wrapper)
Tour Kit: 8.1 KB
Reactour: ~12 KB
Shepherd: ~25 KB
Intro.js: ~29 KB
React Joyride: ~34 KB

Driver.js is smallest but you'll write all the React glue code yourself.

**5/** How to choose:
- Fast prototype on React 18 -> React Joyride
- Multi-framework team -> Shepherd
- Smallest bundle -> Driver.js
- Design system + a11y + React 19 -> Tour Kit
- PM-led (no devs) -> SaaS platform

**6/** Full comparison table, methodology, code examples, and FAQ:

https://usertourkit.com/blog/what-is-best-react-product-tour-library

(Bias note: I built Tour Kit. Every number is verifiable against npm/GitHub/bundlephobia.)
