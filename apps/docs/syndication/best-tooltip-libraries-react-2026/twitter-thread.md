## Thread (6 tweets)

**1/** I tested 10 React tooltip libraries in the same Vite 6 + React 19 project. Bundle sizes range from 0kB to 889KB. Here's what I found 🧵

**2/** Floating UI (~3kB gzipped) powers half the tooltip libraries out there. It replaced Popper.js, has 30K+ GitHub stars, and 6.25M weekly downloads. The tradeoff: you wire up every ARIA attribute yourself.

**3/** react-tooltip ships 889KB unminified because of sanitize-html. Devs on GitHub say they "don't use 80% of the features." Meanwhile Radix UI Tooltip gives you WCAG 1.4.13 compliance at ~6kB.

**4/** The 2026 wildcard: the browser Popover API. 0kB JavaScript. Show/hide, Escape dismissal, and light-dismiss are native. Pair with CSS anchor positioning and you can skip tooltip libraries for simple cases. (Anchor positioning isn't in Firefox/Safari yet.)

**5/** On accessibility: WCAG 1.4.13 says tooltips must be dismissable (Escape), hoverable (mouse can move to tooltip), and persistent. Only Radix, Ariakit, and React Aria pass all three. CSS-only tooltips fail everything.

**6/** Full comparison with bundle sizes, WCAG compliance, and a decision framework:

https://usertourkit.com/blog/best-tooltip-libraries-react-2026
