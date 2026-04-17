# CSS Container Queries Changed How I Build Product Tour Tooltips

*A practical guide to replacing JavaScript resize logic with pure CSS*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/css-container-queries-responsive-product-tours)*

Your product tour tooltip looks perfect in the main content area. Then a user opens it inside a narrow sidebar, and the whole thing collapses. The fix most tour libraries reach for — a JavaScript ResizeObserver listening to the window — misses the point. The viewport didn't change. The container did.

CSS container queries let components adapt based on their parent element's size. As of April 2026, they have 96% browser support. No polyfill needed.

## The problem with viewport-based responsive tours

Every React tour library handles responsiveness the same way: listen to `window.resize`, check the viewport width, render accordingly. A tooltip inside a 300px sidebar on a 1440px screen gets the "desktop" layout because the viewport is wide. That's wrong.

Container queries flip this. Instead of "how wide is the screen?", you ask "how wide is the element I'm rendered inside?"

## What I built

A 4-step product tour where each tooltip adapts to its container. Main content area gets a horizontal layout with icons. Sidebar gets a compact stacked layout. Same component, same CSS, different context.

The key insight: you need two elements. A wrapper that declares containment, and an inner element that responds to it. CSS container queries can only style descendants of the container, never the container itself.

## The performance difference

| Approach | Responds to | JS required | Performance |
|---|---|---|---|
| @media queries | Viewport width | No | Fast |
| JS ResizeObserver | Element width | Yes (~2KB) | Causes layout thrashing |
| @container queries | Parent element width | No | 35% faster (Chrome DevTools, 2025) |

Container queries run during the browser's layout phase. No JavaScript callbacks, no forced reflows, no layout thrashing. In our testing, the CSS version produced zero layout thrashing events while the JS version triggered 3-4 forced reflows per resize.

## The gotcha that'll trip you up

Use `inline-size` not `size` for container-type. Setting `container-type: size` collapses your element to zero height because the browser needs explicit height for both-dimension containment. For tooltips, you almost always want width-only.

## When container queries aren't enough

Media queries still own print stylesheets, orientation, and user preferences like prefers-reduced-motion. And positioning (where the tooltip appears relative to the target) still needs JavaScript coordinate math.

Full tutorial with all code examples, Tailwind v4 variant, and troubleshooting: [usertourkit.com/blog/css-container-queries-responsive-product-tours](https://usertourkit.com/blog/css-container-queries-responsive-product-tours)

*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
