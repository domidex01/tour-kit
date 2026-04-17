# Is There a Product Tour Library That Works With Both Vue and React?

## The cross-framework question every team running multiple frontends eventually asks

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-library-vue-react)*

If you run Vue on one product and React on another, the standard advice is "pick Shepherd.js." That advice isn't wrong, but it skips the part where Shepherd's React and Vue wrappers are thin convenience layers over a vanilla JS core. You get cross-framework coverage, but you lose the idiomatic hooks and composability that made you choose Vue or React in the first place.

The real question isn't "does a cross-framework tour library exist?" It does. Several do. The question is whether the developer experience survives the abstraction.

We tested the major options in a Vite 6 + React 19 and a Nuxt 3 + Vue 3 project.

## The short answer

As of April 2026, three product tour libraries work across both Vue and React:

- **Shepherd.js** — 13.7K GitHub stars, 656 kB unpacked, MIT licensed
- **Driver.js** — 25.5K stars, 83 kB unpacked, MIT licensed
- **Intro.js** — 23.8K stars, 874 kB unpacked, AGPL-licensed (commercial license required for business use)

All three are vanilla JavaScript cores with framework wrappers. None provides first-class Vue 3 Composition API hooks or first-class React hooks from a shared engine.

## How the wrappers actually work

Every library claiming cross-framework support follows the same pattern: a vanilla JS engine that manipulates the DOM directly, wrapped in thin framework adapters. The core calculates positions, draws overlays, manages step state. Framework components wrap the core for each ecosystem.

The wrapper quality varies wildly. Shepherd's React wrapper is still class-based — no hooks rewrite. The Vue wrapper targets both Vue 2 and Vue 3 but doesn't use the Composition API internally.

Driver.js skips wrappers entirely. Pure vanilla JS. You call it imperatively from inside a `useEffect` or `onMounted`. Honest, at least.

## Which library fits your stack?

**Vue 3 only:** Use v-onboarding for simple tours or VueJS Tour for Composition API support. Neither has accessibility compliance or analytics built in.

**React 18+ only:** Use a React-native library like Tour Kit (headless, accessible, under 8 kB gzipped) or React Joyride (~400K weekly downloads, opinionated styling).

**Both Vue and React:** Shepherd.js has the widest framework support and active maintenance. For lighter needs, Driver.js at 83 kB covers tours and spotlights without the weight.

**Accessibility required:** Tour Kit is the only library making explicit WCAG 2.1 AA compliance claims with focus trapping, ARIA landmarks, and keyboard navigation. React only today.

## Looking ahead: web components

CSS anchor positioning is worth watching. CSS-Tricks documented a web component using native CSS `anchor-name` and `position-area` properties to position tour tooltips without JavaScript. It works in Chromium 125+ today. In 12–18 months, this could make the "which framework" question irrelevant for positioning.

Full article with code examples, comparison table, and decision framework: [usertourkit.com/blog/product-tour-library-vue-react](https://usertourkit.com/blog/product-tour-library-vue-react)

---

*Disclosure: We built Tour Kit. Data points sourced from npm, GitHub, and bundlephobia.*

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, Bits and Pieces
