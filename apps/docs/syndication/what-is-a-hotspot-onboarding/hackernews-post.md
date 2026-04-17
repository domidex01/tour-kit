## Title: What is a hotspot? In-app guidance element explained

## URL: https://usertourkit.com/blog/what-is-a-hotspot-onboarding

## Comment to post immediately after:

I wrote this because I kept seeing "hotspot," "beacon," and "tooltip" used interchangeably in onboarding docs, and the accessibility requirements were scattered across different W3C specs.

The short version: a hotspot is the full UX pattern (pulsing beacon + tooltip on click), while a beacon is just the visual indicator. The interesting part is that hotspots are actually more accessible on mobile than tooltips — they use click/tap instead of hover, which doesn't exist on touch devices.

WCAG 2.1 SC 1.4.13 requires three things for any content appearing on hover/focus: dismissible via Escape, hoverable without disappearing, and no timeout-based hiding. Sarah Higley from Microsoft has an excellent analysis of why most tooltip implementations get this wrong.

Practical data points: UX Myths research shows less than 20% of page copy gets read, which is why opt-in patterns like hotspots outperform forced walkthroughs. Whatfix reports 82% higher confidence with in-context guidance.

I work on Tour Kit (headless onboarding library for React), so the article includes a code example, but the definition and accessibility guidance applies regardless of what you use to implement hotspots.
