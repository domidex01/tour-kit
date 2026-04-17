# What Is a Tooltip? A Developer's Actual Definition

### The UX pattern everyone uses but nobody defines correctly

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-a-tooltip)*

Search "what is a tooltip" and you'll get pages written by product marketers. They'll talk about "enhancing user experiences" without mentioning ARIA attributes, WCAG requirements, or what `role="tooltip"` actually does (spoiler: nothing useful for screen readers).

Here's the developer version.

A tooltip is a small floating text label that appears when a user hovers over or focuses on a trigger element. It provides supplementary, non-essential information. The W3C defines it as "a popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it." As of April 2026, the W3C's own tooltip spec still lacks task force consensus.

**Tooltip vs popover vs toast:**
- Tooltip: appears on hover/focus, brief text, auto-dismisses
- Popover: requires click/tap, interactive content, stays until closed
- Toast: notification about a completed action, auto-disappears, no trigger element

## The Part Most Articles Miss

WCAG 1.4.13 mandates three properties for tooltips: they must be dismissable (Escape key), hoverable (mouse can move over the tooltip without it vanishing), and persistent (stays visible until the user acts).

Here's the real problem: 59% of global web traffic comes from mobile devices. Touch screens can't hover. A hover-only tooltip is invisible to most of the internet.

Sarah Higley, a Microsoft accessibility engineer, also pointed out that `role="tooltip"` — the ARIA role every tutorial tells you to add — has no meaningful effect on screen reader behavior. The attributes doing the actual work are `aria-describedby` and `aria-labelledby`.

## Four Types of Tooltips

Not all tooltips serve the same purpose:

1. **Informational** — explains what an element does ("Export as CSV")
2. **Instructional** — guides how to interact ("Drag to reorder items")
3. **Validation** — feedback on input ("Password must include a number")
4. **Progress** — completion status ("Step 3 of 5")

The first two are standard UI. The last two appear in product tours and onboarding flows. When a tooltip carries progress state, you're building guided experiences, not hover labels.

## The 150-Character Rule

Keep tooltip text under 150 characters. UX research shows anything beyond two lines gets ignored. If you need more space, you need a different pattern: a popover, inline help, or a dedicated onboarding step.

The full article covers React code examples, positioning engine internals, and how tooltips work inside product tours: [usertourkit.com/blog/what-is-a-tooltip](https://usertourkit.com/blog/what-is-a-tooltip)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, UX Collective*
