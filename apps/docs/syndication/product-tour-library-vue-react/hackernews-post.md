## Title: Cross-framework product tour libraries: Shepherd.js, Driver.js, and the wrapper tradeoff

## URL: https://usertourkit.com/blog/product-tour-library-vue-react

## Comment to post immediately after:

I tested every major product tour library that claims to work across Vue and React. The findings were interesting but not surprising: every "cross-framework" library is really vanilla JS with thin wrappers.

Shepherd.js (13.7K stars, 656 kB unpacked) has the widest wrapper coverage — React, Vue, Angular, Ember. But the React wrapper is still class-based. Driver.js (25.5K stars, 83 kB) skips wrappers entirely and lets you call its API imperatively. Intro.js (23.8K stars, 874 kB) uses AGPL, which is a licensing gotcha for commercial use.

The Vue ecosystem is particularly underserved. Vue Tour hasn't been published in 5 years. VueJS Tour and v-onboarding exist but are small. No library in either ecosystem makes explicit WCAG 2.1 AA accessibility claims.

One forward-looking angle: CSS anchor positioning (CSS-Tricks covered a `<hand-hold>` web component using `anchor-name` and `position-area`) could eventually make the framework wrapper question moot for tooltip positioning. Currently Chromium-only, but interesting to watch.

Disclosure: I built Tour Kit (React-only today). The article compares everything honestly, including our limitations.
