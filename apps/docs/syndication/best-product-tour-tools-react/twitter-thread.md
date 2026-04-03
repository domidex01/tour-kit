## Thread (7 tweets)

**1/** I installed 10 different product tour tools into the same React 19 project and compared them head to head.

Bundle sizes ranged from 5KB to 90KB. Only 4 out of 10 actually support React 19.

Here's what I found 🧵

**2/** The lightest option: Driver.js at 5KB gzipped. Beautiful highlight animations. But no React wrapper — it manipulates the DOM directly, which fights React's reconciler.

The heaviest: Appcues and Userpilot inject 80-90KB snippets at runtime. And they charge $249/month.

**3/** The licensing surprise: Shepherd.js and Intro.js both use AGPL-3.0.

That means you have to open-source your entire app or buy a commercial license. Their websites don't make this obvious. Check package.json before you ship.

**4/** React 19 is a mess for tour libraries. React Joyride just rewrote their whole library (v3) to drop class components. Shepherd.js works through a react-shepherd wrapper. Driver.js and Intro.js don't even have React bindings.

Only User Tour Kit, OnboardJS, and Onborda support it natively.

**5/** The headless vs. opinionated split matters more than bundle size.

Libraries like React Joyride ship their own tooltip UI with inline styles. If you're running Tailwind or shadcn/ui, you'll fight those styles constantly.

Headless options (User Tour Kit, OnboardJS) render with your components.

**6/** SaaS vs. open-source comes down to who builds the tours.

If developers build them: open-source. $0-99 once.
If PMs build them: SaaS with a visual editor. $249/month.

No in-between exists yet.

**7/** Full comparison table, scoring methodology, and a "how to choose" framework:

https://usertourkit.com/blog/best-product-tour-tools-react

(Disclosure: I built User Tour Kit. Tried to be fair with every entry.)
