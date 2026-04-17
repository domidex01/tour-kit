## Title: Keyboard accessibility gotchas in React product tours

## URL: https://usertourkit.com/blog/keyboard-navigable-product-tours-react

## Comment to post immediately after:

I've been working on Tour Kit, a headless product tour library for React, and spent significant time getting keyboard navigation right. This post covers the three things that tripped us up most.

The WebAIM Million report (2025) found 95.9% of homepages have detectable WCAG failures, and missing keyboard support is among the top five. Most React tour libraries don't implement focus trapping within tooltips or aria-live announcements for step transitions.

The three main gotchas: (1) focus escaping the tooltip when users Tab, (2) arrow keys navigating the tour instead of moving the cursor when users are typing in form fields, and (3) focus not returning to the original element when the tour ends.

The patterns are framework-agnostic (standard DOM event listeners and aria-live regions), though the examples use Tour Kit's hooks. Tested against axe-core 4.10 and VoiceOver with zero violations.

Honest limitations of Tour Kit: no visual builder, no React Native support, smaller community than Joyride. The keyboard and accessibility parts work well though.
