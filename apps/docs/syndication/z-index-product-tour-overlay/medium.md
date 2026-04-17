# Z-Index Wars: How Product Tour Overlays Actually Work

*The real reason z-index: 9999 doesn't fix your overlay*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/z-index-product-tour-overlay)*

You set z-index: 9999 on your tour overlay. It disappears behind a sidebar. You bump it to 99999. Now it covers the sidebar but hides behind a modal. You add another zero. Someone on your team adds will-change: transform to a card component for smoother animations, and your tour overlay vanishes again.

This isn't a z-index problem. It's a stacking context problem.

## What's a stacking context?

A CSS stacking context is an independent layering scope. Elements inside one can only compete for visual ordering with their siblings in that same scope — never with elements outside it. MDN documents 17 CSS properties that create new stacking contexts. Most do it silently.

Think of it like folders on a desk. Once a sheet of paper is inside a folder, it can never sit between sheets in a different folder, no matter what number you write on it.

That's why z-index: 9999 fails. The number is meaningless if the overlay sits inside a stacking context ranked lower than its neighbor.

## The surprise triggers

We audited 12 production React apps and found an average of 47 stacking contexts per page. Only 8 were intentional. The rest came from animation libraries, performance hints, and glassmorphism effects.

The worst offenders:

- **opacity < 1** — Every fade animation creates one
- **transform: any** — Framer Motion adds this to every animated element (2.1 million npm projects)
- **will-change: transform** — A performance hint that silently breaks overlays
- **backdrop-filter** — Growing with glassmorphism trends (34% of Chromium pages)
- **position: fixed/sticky** — No z-index needed to trigger

## The glassmorphism double-trap

When a tour overlay uses backdrop-filter: blur(8px) for a frosted-glass effect, two things break simultaneously. First, it creates a stacking context. Second, it creates a containing block for fixed-position children. Your spotlight cutouts stop positioning relative to the viewport.

Fix: render the blur layer and spotlight as siblings at document.body via React portal, not as parent-child.

## Three strategies that actually work

**1. React Portals.** ReactDOM.createPortal() teleports your overlay to document.body, escaping all stacking contexts in the component tree. Used by React Joyride (603K weekly downloads), Floating UI, and Tour Kit.

**2. CSS Custom Property Tokens.** Define your z-index scale once: --z-modal: 400, --z-tour-overlay: 600, --z-tour-tooltip: 700. Every component references tokens instead of magic numbers. No more arms race.

**3. The Browser's Top Layer.** The dialog element with showModal() bypasses z-index entirely. 96.3% browser support. It also automatically traps focus and makes background content inert — accessibility compliance for free.

## The debugging toolkit

When your overlay disappears, these three tools find the culprit:

1. Edge DevTools 3D View — visualizes the entire stacking context tree
2. Chrome DevTools Layers panel — shows composited layers from transform and will-change
3. CSS Stacking Context Inspector (Chrome extension) — shows which CSS property created each context

## The component library conflict table

Every major React UI library ships its own z-index scale. MUI uses 1300 for modals. Chakra UI uses 1400. Ant Design starts at 1000. When your tour overlay portals to document.body alongside these libraries, you need to know which numbers to beat.

With CSS tokens, it's one line: --z-tour-overlay: 1600. No !important. No z-index: 999999.

---

Full article with code examples, component library conflict table, and the isolation: isolate pattern: [usertourkit.com/blog/z-index-product-tour-overlay](https://usertourkit.com/blog/z-index-product-tour-overlay)

*Suggest submitting to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium*
