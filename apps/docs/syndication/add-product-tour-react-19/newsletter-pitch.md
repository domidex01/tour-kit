## Subject: Tutorial — Adding a product tour to a React 19 app with ref-as-prop and useTransition

## Recipients:
- **Cooperpress** (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- **This Week in React**: sebastien@thisweekinreact.com
- **Bytes.dev**: submit via their site

---

## Email body (Cooperpress):

Hi,

I wrote a step-by-step tutorial on adding a product tour to a React 19 app using userTourKit (headless, under 8KB gzipped). The interesting part is how React 19's new primitives change the implementation:

- ref-as-prop eliminates the forwardRef wrappers that older tour libraries still require
- async useTransition lets you await route navigation before advancing tour steps (no useEffect chains)
- Server Components work around the tour provider with a single 'use client' boundary

5 minutes from npm install to a working 4-step tour. Full TypeScript throughout.

Link: https://usertourkit.com/blog/add-product-tour-react-19

Disclosure: I built userTourKit. The React 19 patterns in the tutorial apply to any tour implementation.

Thanks,
Domi

---

## Email body (This Week in React):

Hi Sebastien,

Wrote a tutorial on adding a product tour to a React 19 app that covers two patterns your readers might find useful:

1. Using ref-as-prop for tour target elements (no forwardRef needed — most tour libraries haven't adopted this yet)
2. Async useTransition for multi-page tour navigation (await router.push, then advance the step in one callback)

The tutorial uses userTourKit (a headless library I built), but the React 19 patterns apply generally. Covers Vite 6 + React 19.1 + TypeScript 5.7 setup.

Link: https://usertourkit.com/blog/add-product-tour-react-19

Thanks,
Domi

---

## Email body (Bytes.dev):

Tutorial on adding a product tour to React 19 using ref-as-prop and async useTransition. Most React tour libraries still use forwardRef internally — this shows the React 19 way. 5 minutes, 4 steps, under 8KB gzipped.

Link: https://usertourkit.com/blog/add-product-tour-react-19
