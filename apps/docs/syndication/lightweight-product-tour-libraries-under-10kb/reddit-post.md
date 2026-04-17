## Subreddit: r/reactjs

**Title:** How much JavaScript does your product tour library add? I measured 10+ and most are surprisingly heavy.

**Body:**

I got curious about how much bundle weight product tour libraries actually add, so I installed a bunch into the same Vite 6 + React 19 + TS 5.7 project and checked gzipped sizes via bundlephobia and the Vite build analyzer.

The results were pretty eye-opening. React Joyride is around 50KB minified. Shepherd.js is 30KB plus Floating UI. For code that runs once per user session and then sits idle in the bundle, that's a lot of JavaScript.

Only five libraries I tested stayed under 10KB gzipped:

- **Driver.js** (~5KB) — lightest option, but vanilla JS. No React hooks, no state management. You wire everything yourself with useEffect
- **Intro.js** (~4-5KB) — smallest raw size but AGPL-3.0 licensed. If your app is commercial and closed-source, you need their commercial license
- **Tour Kit** (<8KB core) — headless, React-native, WCAG 2.1 AA. Disclosure: this is my project, so factor that in
- **Onborda** (~8KB) — Next.js App Router only, and requires Framer Motion as a peer dep (adds 30KB+ if you don't already have it)
- **OnboardJS** (~8-10KB) — flow orchestration, not DOM highlighting. State machine approach, you build all the UI

The biggest surprise was that no tour library markets tree-shaking support or connects bundle size to Core Web Vitals, despite that being the whole reason performance-conscious teams care about this.

Wrote up the full comparison with a table, licensing breakdown, and accessibility notes: https://usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb

What tour library are you using and have you checked its bundle impact?
