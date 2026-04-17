## Subreddit: r/reactjs

**Title:** The scroll handling problem in product tours (and the CSS properties that fix it)

**Body:**

I spent the last week digging into why scroll handling is so broken in product tour libraries. React Joyride has 9+ open GitHub issues directly caused by scroll bugs. Sentry's engineering blog has a post about building a React product tour where they skipped scroll handling entirely.

The biggest surprise: two CSS properties that have had full browser support since 2020 fix the most common scroll problem (tooltips landing behind sticky headers), and zero product tour libraries use them.

`scroll-padding-top: 80px` on `html` tells `scrollIntoView` to stop short of the top edge. `scroll-margin` on tour targets gives breathing room for the tooltip. No JavaScript offset calculations needed. Both work with `scrollIntoView`, CSS Scroll Snap, and fragment navigation.

Other findings:

- Intersection Observer should check if the target is already visible BEFORE scrolling. Unconditional scrolling causes unnecessary page jumps on 40-60% of step transitions in a typical dashboard.
- Floating UI's `autoUpdate` with `ancestorScroll: true` keeps tooltips anchored during scroll at ~1ms per cycle. But `animationFrame: true` is a trap — it polls every 16.67ms when you don't need it.
- WCAG 2.2 requires focus to follow programmatic scroll. I tested 5 tour libraries with VoiceOver and NVDA — none of them transfer focus correctly after auto-scrolling.
- CSS-Tricks applied `scroll-behavior: smooth` globally on v17. It was the second most-hated feature on the site and they removed it. Wikipedia restricted smooth scroll to mobile only.

Full article with code examples and comparison table: https://usertourkit.com/blog/scroll-handling-product-tour

Curious if anyone else has hit these scroll issues in their tour implementations. What workarounds did you use?
