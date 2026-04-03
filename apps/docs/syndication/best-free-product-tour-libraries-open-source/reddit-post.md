## Subreddit: r/reactjs

**Title:** I tested 9 open-source tour libraries in a React 19 project -- bundle sizes, accessibility, and one AGPL trap

**Body:**

I've been evaluating product tour libraries for a React project and got tired of roundups that mix SaaS platforms with npm packages. So I installed 9 open-source tour libraries into the same Vite 6 + React 19 + TypeScript 5.7 project and actually tested them.

Here's what stood out:

- Bundle sizes range from 5KB (Driver.js) to 30KB (React Joyride). That 6x difference matters on mobile.
- Only a few actually support React 19 natively. React Joyride needed a full v3 rewrite. Shepherd.js works through a wrapper. Driver.js and Intro.js manipulate the DOM directly with no React bindings.
- **Intro.js uses AGPL-3.0.** That means you have to open-source your entire app or buy a commercial license. Their website doesn't make this obvious. Always check `package.json` before you ship.
- Almost none of them claim WCAG 2.1 AA compliance. Shepherd.js has keyboard nav. Reactour has accessible overlays. But nobody publishes Lighthouse scores or documents ARIA roles. The accessibility bar in this space is surprisingly low.
- The headless options (userTourKit, OnboardJS) let you render with your own components. If you're using Tailwind or shadcn/ui, that avoids the inline-style conflicts you get with Joyride.

I scored them on bundle size, TypeScript support, React 19 compat, accessibility, maintenance activity, and license. Full writeup with comparison table: https://usertourkit.com/blog/best-free-product-tour-libraries-open-source

Disclosure: I built userTourKit, which is #1 on the list. I tried to be fair -- every data point is verifiable on npm, GitHub, and bundlephobia. Happy to answer questions about any of the libraries I tested.

What are you all using for product tours? Curious if anyone has experience with the newer headless options.
