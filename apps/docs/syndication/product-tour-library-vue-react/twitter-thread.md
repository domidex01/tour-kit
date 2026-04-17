## Thread (6 tweets)

**1/** "Just use Shepherd.js" is the standard advice when you need product tours in both Vue and React.

It's not wrong. But it skips the part where every "cross-framework" tour library is really vanilla JS with thin wrappers. Tested them all.

**2/** The landscape as of April 2026:

- Shepherd.js: 13.7K stars, 656 kB unpacked, wrappers for React/Vue/Angular
- Driver.js: 25.5K stars, 83 kB, pure vanilla JS (no wrappers at all)
- Intro.js: 23.8K stars, 874 kB, AGPL licensed (gotcha for commercial use)

**3/** The DX tradeoff nobody talks about:

Shepherd's React wrapper is still class-based. No hooks.
The Vue wrapper doesn't use Composition API internally.
You're calling imperative methods on refs instead of using reactive state.

**4/** Vue's tour ecosystem is especially thin:

- Vue Tour: last published 5 years ago
- VueJS Tour: small community
- v-onboarding: lightweight but no a11y

No library in either ecosystem makes explicit WCAG 2.1 AA claims.

**5/** Forward-looking: CSS anchor positioning could change everything.

CSS-Tricks documented a web component using native `anchor-name` and `position-area` to position tooltips without JS calculations.

Chromium 125+ today. If browser support lands broadly, framework wrappers become irrelevant for positioning.

**6/** Full comparison table with bundle sizes, React 19 compat, license details, and a decision framework:

https://usertourkit.com/blog/product-tour-library-vue-react

(Disclosure: I built Tour Kit, a React-only headless option. Article covers all options honestly.)
