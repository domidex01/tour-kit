Every product tour library handles responsive tooltips the same way: listen to the window resize event and check viewport width.

The problem? A tooltip inside a 300px sidebar on a 1440px screen gets the desktop layout. The viewport is wide. The available space isn't.

I switched to CSS container queries and the results were measurable:

- 35% faster rendering than ResizeObserver (Chrome DevTools, 2025)
- Zero layout thrashing vs 3-4 forced reflows per resize with JavaScript
- 25% bundle size reduction — no JS resize library needed
- 96% browser support, no polyfill required

The shift from viewport-based to container-based responsive design matters most for components that render in unpredictable contexts — tooltips, popovers, cards in varying column layouts.

Wrote up the full approach with code examples and a Tailwind v4 variant: https://usertourkit.com/blog/css-container-queries-responsive-product-tours

#css #react #frontend #webdevelopment #javascript #productdesign
