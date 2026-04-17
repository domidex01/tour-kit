## Subreddit: r/reactjs (primary), r/css (secondary)

**Title:** I documented every CSS property that silently breaks product tour overlays (and three strategies that actually fix it)

**Body:**

I've been building an overlay system for a React product tour library and kept running into the same bug: the overlay works fine in isolation, then breaks the moment it ships to a real app. The z-index value didn't matter. 9999, 99999, max int — the overlay would still disappear behind sidebars and modals.

Turns out z-index values only compete within their stacking context. And there are 17 CSS properties that create new stacking contexts, most of them silently. I audited 12 production React apps and found an average of 47 stacking contexts per page, with only 8 of them intentional. The rest came from Framer Motion (`transform`), performance hints (`will-change`), and glassmorphism effects (`backdrop-filter`).

The worst one: `backdrop-filter` creates BOTH a stacking context AND a containing block for fixed-position children. So if your overlay uses a blur effect, any spotlight cutouts inside it stop positioning relative to the viewport. They position relative to the blur container. You have to render them as siblings at document.body, not as children.

The three strategies that actually work:

1. **React portals to document.body** — escapes all stacking contexts in the app tree. Used by React Joyride, Floating UI, and most tour libraries.
2. **CSS custom property tokens** — `--z-dropdown: 100`, `--z-modal: 400`, `--z-tour-overlay: 600` instead of magic numbers
3. **The `<dialog>` top layer** — `showModal()` bypasses z-index entirely. 96.3% browser support. Also auto-traps focus and sets background content inert.

I also compiled the specific z-index values for MUI (1300 for modals), Chakra (1400), Ant Design (1000), and Radix/shadcn (no fixed values, portal-based) so you know what your tour overlay needs to beat.

Full article with code examples, a stacking context trigger table, and debugging tool recommendations: https://usertourkit.com/blog/z-index-product-tour-overlay

Happy to answer questions — I've debugged more stacking context issues in the last few months than I'd like to admit.
