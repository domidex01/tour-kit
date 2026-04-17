## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote a tutorial on using CSS container queries for product tour tooltips instead of ResizeObserver. The idea is that tooltips should adapt to their parent container's width, not the viewport — so the same component works in a sidebar and main content area without JS resize logic.

Includes plain CSS and a Tailwind v4 variant: https://usertourkit.com/blog/css-container-queries-responsive-product-tours

Curious if anyone else has used container queries for tooltip/popover-type components? Hit a few gotchas with portals that might be worth discussing.
