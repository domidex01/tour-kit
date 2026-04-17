## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote up something I kept running into while building a tour library — there's no native browser API for position tracking, so tooltip/popover positioning requires combining ResizeObserver + MutationObserver + IntersectionObserver + event listeners. Mapped which observer solves which problem with React hooks and cleanup patterns.

https://usertourkit.com/blog/dom-observation-product-tour

Curious if anyone else has hit the ResizeObserver loop limit error in production — turns out it affects MUI, Ant Design, and floating-ui but is actually benign.
