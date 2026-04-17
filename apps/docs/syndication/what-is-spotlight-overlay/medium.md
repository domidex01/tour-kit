# What Is a Spotlight Overlay? The UI Pattern Behind Every Product Tour

### How dimmed backgrounds and transparent cutouts guide users through complex interfaces

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-spotlight-overlay)*

---

You click a "Start tour" button and the screen dims. One button stays bright, sitting inside a rounded cutout in the dark layer. A tooltip next to it says "Click here to create your first project."

That bright cutout is a spotlight overlay.

If you've used Notion, Figma, or Slack for the first time, you've seen this pattern. It shows up in almost every product tour and onboarding flow, and for good reason: 70% of app features go undiscovered without active user guidance, according to Plotline's research on in-app guidance patterns.

## What exactly is a spotlight overlay?

A spotlight overlay is a full-screen semi-transparent layer with a transparent cutout positioned over a target UI element. The dimmed background reduces visual noise while the cutout draws the user's eye to a specific control or section.

Atlassian's design system defines it as a component that "introduces users to points of interest, from focused messages to multi-step tours."

The key difference from a modal dialog: the user can still see and interact with the highlighted element in its original context. The surrounding UI is dimmed, not hidden.

## How it works under the hood

The mechanic has three parts:

1. A fixed-position element covers the entire viewport with a semi-transparent background
2. JavaScript reads the target element's position and creates a transparent hole at those coordinates
3. A tooltip anchors to the cutout with context or a call to action

Three CSS techniques create the cutout, each with trade-offs:

- **box-shadow** on the target element — simplest (5 lines of CSS), but only supports rectangles and doesn't block interaction with the background
- **clip-path** with evenodd fill — supports any shape including rounded corners, creates a true overlay that blocks background clicks. This is what most tour libraries use.
- **SVG clipPath** — most flexible for arbitrary shapes, but more verbose markup

A fourth technique, mix-blend-mode, creates a visual glow but doesn't block pointer events beneath the overlay. React Joyride used this approach historically, which led to broken spotlights in dark mode.

## Why it matters

Strategic spotlight implementations improve feature adoption by 40–60%, according to Plotline. Russell Brown, Senior Product Designer at Chameleon, explains: "Focus on one element at a time. Highlighting something prevents users feeling overwhelmed."

But poorly implemented spotlights create the opposite effect. Tooltip copy past 140 characters overwhelms users mid-task. Generic page-load spotlights annoy returning users who've already seen the tour.

The 2026 trend is behavior-triggered spotlights: show the highlight when a user first encounters a feature, not on every page load.

## Accessibility is the hard part

Spotlight overlays must behave like modal dialogs:

- Use role="dialog" and aria-modal="true"
- Trap keyboard focus within the tooltip controls
- Dismiss on Escape key
- Restore focus to the trigger element on close

WCAG 2.2 SC 2.4.11 (Focus Not Obscured) requires that focused elements aren't hidden by the overlay. The cutout handles this for the target element, but the tooltip controls need proper focus management too.

---

Full article with working React code examples: [usertourkit.com/blog/what-is-spotlight-overlay](https://usertourkit.com/blog/what-is-spotlight-overlay)

*Suggest submitting to: JavaScript in Plain English, Better Programming, or The Startup*
