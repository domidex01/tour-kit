## Subreddit: r/reactjs

**Title:** I tried building a product tour with web components. Here's why I went back to React.

**Body:**

I maintain Tour Kit, a headless product tour library for React. Early on I seriously considered building it as web components for framework portability. After prototyping the overlay and positioning engine as custom elements, I switched back to React. Here's what I found.

The core issue is shadow DOM. Product tours need an overlay that sits above everything on the page, a spotlight that tracks elements, a focus trap for keyboard accessibility, and a state machine for step sequencing. Each of these is a cross-cutting concern that fights shadow DOM encapsulation:

- Overlay positioning: each shadow root creates its own stacking context, so overlays inside a shadow root can't reliably sit above elements in other roots
- Style piercing: you can't apply Tailwind classes to elements inside a shadow root without a separate build scoped to that root
- Focus trapping: `document.querySelectorAll` can't see inside shadow DOM, and closed shadow roots are completely inaccessible
- Event retargeting: click events lose their original target when crossing shadow boundaries, which breaks analytics

React's context + hooks + batched rendering handle all of this naturally. `useContext` shares tour state across subsystems. A single render cycle coordinates overlay position, spotlight cutout, focus trap, and tooltip rendering.

Bundle-wise, if your app already loads React, a React-based tour (Tour Kit is ~20KB gzipped) adds less weight than Lit (~17KB) plus the tour logic on top of React.

Web components are great for isolated leaf components — buttons, tooltips, data tables. For orchestration-heavy UI like product tours, a framework's component model is worth the "lock-in."

Wrote a full deep-dive with benchmark data and code examples: https://usertourkit.com/blog/web-components-vs-react-product-tour

Curious if anyone else has hit similar shadow DOM pain points with complex interactive overlays.
