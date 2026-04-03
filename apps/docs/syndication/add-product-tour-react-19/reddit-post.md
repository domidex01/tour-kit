## Subreddit: r/reactjs

**Title:** I wrote a tutorial on adding a product tour to a React 19 app — uses ref-as-prop and async useTransition

**Body:**

I've been building product tours for React apps and kept running into the same issue: most tour libraries were written for React 16 and still rely on `forwardRef` wrappers internally. With React 19 making refs regular props, that whole pattern is unnecessary.

So I wrote up a step-by-step tutorial for adding a product tour to a React 19 app using userTourKit (a headless tour library I built). The tutorial covers:

- Setting up a 4-step product tour with CSS selector targets (no forwardRef needed)
- Using `useTour()` hook for custom tour controls and progress indicators
- Async step navigation with React 19's `useTransition` — you can `await` a route change before advancing the tour, no `useEffect` chains needed
- Wiring it into a Next.js App Router or Vite layout

The whole thing takes about 5 minutes from `npm install` to a running tour. Core package is under 8KB gzipped. It's headless, so it renders with whatever components you already have (shadcn/ui, Radix, Tailwind, etc.).

One thing I found interesting while building this: most React tour libraries haven't updated for React 19's primitives yet. React Joyride shipped a v3 rewrite in March to move to hooks, but it still uses `forwardRef` internally. Shepherd.js works through a separate wrapper package. Driver.js and Intro.js have no React bindings at all.

Tutorial: https://usertourkit.com/blog/add-product-tour-react-19

Disclosure: I built userTourKit, so take the recommendation with that context. The tutorial itself should be useful regardless of which library you choose — the React 19 patterns (ref-as-prop, async useTransition) apply to any tour implementation. Happy to answer questions.
