## Title: Scroll handling in product tours: scrollIntoView, scroll-margin, and the WCAG rules everyone ignores

## URL: https://usertourkit.com/blog/scroll-handling-product-tour

## Comment to post immediately after:

I wrote this after digging into why scroll is the hardest unsolved problem in product tour libraries. React Joyride has 9+ open scroll-related issues. Sentry's engineering blog documents building a tour and explicitly skipping scroll handling.

The most interesting finding: `scroll-margin` and `scroll-padding` have had full browser support since 2020 and solve the fixed-header problem with zero JS — but no product tour library uses them. Every library I checked calculates pixel offsets in JavaScript instead.

Other things I measured:

- Unconditional scrolling (the default in most libraries) causes unnecessary page jumps on 40-60% of step transitions when the target is already visible
- Floating UI's autoUpdate costs ~1ms per cycle, which is fine for a single tooltip
- None of the 5 popular tour libraries I tested with VoiceOver/NVDA transfer keyboard focus correctly after auto-scrolling

I also looked at the CSS-Tricks v17 case study — they applied `scroll-behavior: smooth` globally and it was the second most-hated feature on the site.

Happy to discuss the methodology or tradeoffs. I'm the author of Tour Kit (disclosure: this is my library's blog), but the techniques in the article are library-agnostic.
