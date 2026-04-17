## Title: Z-Index Wars: How Product Tour Overlays Actually Work

## URL: https://usertourkit.com/blog/z-index-product-tour-overlay

## Comment to post immediately after:

I wrote this after spending too many hours debugging overlay z-index issues while building a product tour library in React. The core insight: z-index values only compete within their stacking context, and 17 CSS properties create stacking contexts silently.

The two most surprising triggers: `will-change: transform` (added as a performance hint, silently breaks overlays) and `backdrop-filter` (creates both a stacking context AND a containing block for fixed-position children — a double trap for tour spotlight cutouts).

The article covers three strategies: React portals (the current standard), CSS custom property token systems (for coordinating z-index across teams), and the browser's native top layer via `<dialog>` with `showModal()` — which bypasses z-index entirely and has 96.3% browser support.

I also compiled the specific z-index values from MUI, Chakra, Ant Design, and Radix/shadcn so you can see what your overlay needs to beat. The answer for Radix: nothing, because it uses portals with no fixed z-index values and relies on DOM order.

Best posting time: Tuesday-Thursday, 8-10 AM EST
