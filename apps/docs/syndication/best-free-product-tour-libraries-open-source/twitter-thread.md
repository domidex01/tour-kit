## Thread (7 tweets)

**1/** I installed 9 open-source tour libraries into the same React 19 project and compared them.

Bundle sizes range from 5KB to 30KB. One popular library has a license that could force you to open-source your entire app.

Here's what I found:

**2/** The lightest: Driver.js at 5KB gzipped. Beautiful spotlight animations. But no React wrapper -- it manipulates the DOM directly, which fights React's reconciler.

The heaviest: React Joyride at ~30KB. That's 6x the smallest option.

**3/** The licensing trap: Intro.js uses AGPL-3.0.

That means commercial projects must open-source their entire app or buy a license. Every "free tour library" roundup includes it without flagging this. Check package.json before you ship.

**4/** The accessibility gap is the real story. Almost no open-source tour library claims WCAG 2.1 AA compliance.

Shepherd.js has keyboard nav. Reactour has accessible overlays. Nobody publishes Lighthouse scores. Nobody mentions prefers-reduced-motion.

The bar is shockingly low.

**5/** The headless vs. opinionated split matters more than bundle size.

React Joyride ships inline-styled tooltips. If you use Tailwind or shadcn/ui, you'll fight those styles constantly.

Headless options (User Tour Kit, OnboardJS) render with your components instead.

**6/** Quick decision guide:

- Design system team? Headless (User Tour Kit, OnboardJS)
- Need it working in 10 min? React Joyride
- Multi-framework? Shepherd.js
- Just need highlights? Driver.js (5KB)
- Next.js App Router? Onborda
- Commercial project? Avoid AGPL (Intro.js)

**7/** Full comparison table, scoring methodology, accessibility deep-dive, and FAQ:

https://usertourkit.com/blog/best-free-product-tour-libraries-open-source

(Disclosure: I built User Tour Kit. Tried to be fair with every entry -- all data points are verifiable on npm, GitHub, and bundlephobia.)
