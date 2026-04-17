Teams running both Vue and React hit this question eventually: is there one product tour library that works across both?

I tested Shepherd.js, Driver.js, and Intro.js in a React 19 and Vue 3 project. The findings:

Every "cross-framework" library is really vanilla JS with thin framework wrappers. Shepherd.js has the most coverage (React, Vue, Angular, Ember) but the React wrapper is still class-based. Driver.js at 83 kB is the lightest but has no wrappers at all.

The bigger surprise was Vue's ecosystem. Vue Tour hasn't been updated in 5 years. No library on either side makes explicit WCAG 2.1 AA accessibility compliance claims.

Full comparison with bundle sizes, license gotchas (Intro.js uses AGPL), and a decision framework for choosing based on your stack:

https://usertourkit.com/blog/product-tour-library-vue-react

#react #vuejs #javascript #webdevelopment #productdevelopment #opensource #accessibility
