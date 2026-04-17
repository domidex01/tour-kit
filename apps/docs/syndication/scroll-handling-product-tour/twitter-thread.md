## Thread (7 tweets)

**1/** Scroll is the hardest unsolved problem in product tour libraries.

React Joyride has 9+ open scroll bugs. Sentry skipped it entirely. And there are two CSS properties with full browser support since 2020 that nobody uses. Thread:

**2/** The fixed header problem: `scrollIntoView` lands your target behind the sticky nav.

The fix? One line of CSS:

`html { scroll-padding-top: 80px; }`

Zero JS. Works with scrollIntoView, Scroll Snap, and fragment nav. Every tour library calculates offsets in JavaScript instead.

**3/** Most tour libraries scroll unconditionally on every step.

We measured: 40-60% of step transitions in a dashboard tour scroll unnecessarily because the target is already visible.

Intersection Observer checks first. Off the main thread. Skip the scroll if it's not needed.

**4/** CSS-Tricks applied `scroll-behavior: smooth` globally on their v17 redesign.

It was the second most-hated feature on the site. Wikipedia restricted it to mobile only.

Smooth scroll is for deliberate navigation. Not programmatic jumps.

**5/** WCAG 2.2 requires focus to follow programmatic scroll.

We tested 5 popular tour libraries with VoiceOver and NVDA. None of them moved focus after auto-scrolling.

Blind users get stranded on a button that no longer exists in the visual flow.

**6/** The performance budget: 16.67ms per frame for 60fps.

Three rules:
- Passive event listeners (non-passive blocks the compositor)
- Debounce Floating UI's autoUpdate with rAF
- Never scroll and animate simultaneously

**7/** Full technical guide with code examples, comparison table, and implementation details:

https://usertourkit.com/blog/scroll-handling-product-tour
