## Subreddit: r/reactjs (primary), r/vuejs (secondary)

**Title:** I tested every "cross-framework" product tour library in a React 19 and Vue 3 project. Here's what I found.

**Body:**

I've been building a product tour library and got curious about the cross-framework landscape. Tested Shepherd.js, Driver.js, and Intro.js in both a Vite 6 + React 19 project and a Nuxt 3 + Vue 3 project.

The pattern is the same everywhere: vanilla JS core with thin framework wrappers. Shepherd.js has the most wrappers (React, Vue, Angular, Ember), but the React wrapper is still class-based. Driver.js skips wrappers entirely — you call it imperatively from useEffect or onMounted. Intro.js uses AGPL, which means commercial use requires a paid license (common gotcha).

Key findings:
- No library provides first-class Vue 3 Composition API hooks AND first-class React hooks from the same engine
- Vue Tour (the go-to Vue option) hasn't been updated in 5 years
- Bundle sizes range from 83 kB unpacked (Driver.js) to 874 kB (Intro.js)
- No cross-framework library makes explicit WCAG 2.1 AA accessibility claims
- CSS anchor positioning (Chromium 125+) could make framework wrappers irrelevant for tooltip positioning in 12-18 months

The full comparison table with bundle sizes, license details, React 19 compat, and a decision framework for choosing based on your stack: https://usertourkit.com/blog/product-tour-library-vue-react

Disclosure: I built Tour Kit (React-only headless library, not cross-framework yet). The article covers all the options honestly including Tour Kit's limitations.

Curious what cross-framework approaches other teams have landed on.
