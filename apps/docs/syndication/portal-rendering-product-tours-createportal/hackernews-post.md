## Title: Portal rendering for product tours: createPortal gotchas with event bubbling, a11y, and SSR

## URL: https://usertourkit.com/blog/portal-rendering-product-tours-createportal

## Comment to post immediately after:

I wrote this after spending significant time debugging portal rendering edge cases while building a product tour library.

The three things most createPortal tutorials skip: (1) event bubbling follows the React tree, not the DOM tree, which causes phantom click handlers firing on the portal owner (GitHub issue #11387, open since 2017), (2) screen readers lose semantic connections between trigger and portaled content unless you manually wire up aria-describedby with conditional mounting, and (3) pre-rendering 50+ portal instances causes measurable lag, so conditional rendering based on the active step is required.

The comparison table in the article covers four portal target strategies (document.body, dedicated container, Floating UI's FloatingPortal, and CSS popover attribute) with tradeoffs for each. The CSS top-layer API via the popover attribute is particularly interesting as a future alternative that eliminates createPortal entirely, though React integration is still limited.

One honest caveat: I built Tour Kit (the library this is about), so the article naturally shows its approach. But the portal patterns apply to any React overlay system.
