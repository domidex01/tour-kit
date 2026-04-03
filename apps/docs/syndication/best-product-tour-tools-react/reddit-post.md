## Subreddit: r/reactjs

**Title:** I tested 10 product tour libraries for React 19 — bundle sizes, TS support, and licensing compared

**Body:**

I've been working on onboarding flows for a React app and couldn't find a good comparison that actually measured things instead of just listing features. So I installed 10 different tour tools into a Vite 6 + React 19 + TypeScript 5.7 project and tested each one.

Here's what surprised me:

- Bundle sizes range wildly. Driver.js is 5KB gzipped. React Joyride is 30KB. The SaaS options (Appcues, Userpilot) inject 80-90KB snippets at runtime.
- Only 4 out of 10 actually support React 19 natively. React Joyride just shipped v3 in March to fix this. Shepherd.js works through a wrapper. Driver.js and Intro.js don't have React bindings at all.
- Two of the most popular open-source options (Shepherd.js and Intro.js) use AGPL-3.0 licensing, which means you have to open-source your entire app or buy a commercial license. Worth checking before you `npm install`.
- The headless options (userTourKit, OnboardJS) let you render tours with your own components. If you're running Tailwind or shadcn/ui, that's a big deal since libraries like Joyride use inline styles that fight your design system.

I scored them on bundle size, TypeScript support, React 19 compatibility, accessibility, maintenance activity, feature scope, and pricing. Full table and writeup here: https://usertourkit.com/blog/best-product-tour-tools-react

Disclosure: I built userTourKit, which is #1 on the list. I tried to be fair — every data point is verifiable on npm, GitHub, and bundlephobia. Happy to answer questions about any of the tools I tested.
