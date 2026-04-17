## Title: Building accessible React hotspot components with WCAG 1.4.13 compliance

## URL: https://usertourkit.com/blog/react-hotspot-component

## Comment to post immediately after:

This is a tutorial on building hotspot components (the pulsing dots you see in SaaS apps for feature discovery) in React with proper accessibility.

The gap I noticed: most React hotspot tutorials either use CSS-only pulsing dots with zero keyboard support, or rely on React Joyride's beacon which is tied to a sequential tour model and ships at ~37KB. Neither approach handles WCAG 1.4.13 (Content on Hover or Focus), which requires hover/focus content to be dismissable via Escape, hoverable, and persistent.

The approach: each hotspot is a focusable button with aria-expanded, tooltips use Floating UI for positioning with flip/shift/offset, and state is managed through a React reducer that tracks open/dismissed per hint independently. Total bundle impact is under 10KB gzipped.

One limitation worth noting: this requires React 18+ and there's no visual builder — you're writing JSX. For teams that need a drag-and-drop approach, this isn't the right fit.
