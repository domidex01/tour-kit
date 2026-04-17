## Subreddit: r/reactjs (primary), r/nextjs (secondary)

**Title:** I tested 5 product tour libraries in Next.js 15 App Router — most broke during SSR

**Body:**

I've been working on a tour library and kept running into the same question from people: "does it work with SSR?" So I set up a Next.js 15 App Router project with React 19, strict mode, and Turbopack, then installed five popular libraries to see what actually happens.

Here's the short version:

- **Intro.js** crashed the server immediately — it accesses `document` at the module level. You can work around it with `next/dynamic` + `ssr: false`, but at that point you're not really doing SSR.
- **React Joyride** also needs the `next/dynamic` workaround. Even after that, it produces hydration mismatch warnings because its tooltip container renders before `useEffect` fires.
- **Driver.js** imported fine but showed a visible flicker during hydration on slow connections. At ~5KB it's the lightest option though.
- **Shepherd.js** worked with proper lazy-loading, but it's 37KB and AGPL licensed.
- **Tour Kit** (the one I built — bias disclaimer) handled it out of the box at ~8KB because every component has `"use client"` at the file level.

The core problem is that product tours need browser APIs (getBoundingClientRect, document.body, localStorage) that don't exist on the server. Libraries that access these at import time or during initial render will always clash with SSR.

The three patterns that break things: module-level side effects referencing `window`, inline style calculations during render, and portal rendering before hydration completes.

Full writeup with comparison table, code examples, and testing methodology: https://usertourkit.com/blog/best-product-tour-library-ssr

Happy to answer questions. And yes, I'm aware I have a horse in this race — every data point in the article is verifiable against npm and bundlephobia.
