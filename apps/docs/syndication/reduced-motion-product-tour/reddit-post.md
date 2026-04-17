## Subreddit: r/reactjs

**Title:** How I added prefers-reduced-motion to a React product tour (with an in-tour toggle for users who don't know about OS settings)

**Body:**

I've been working on making product tours accessible and realized something: none of the major onboarding tools (Walnut, ProductFruits, Intercom) even mention `prefers-reduced-motion` in their 2026 guides. That's wild, considering 35% of US adults over 40 have experienced vestibular dysfunction.

Product tours are especially bad for motion sensitivity because they stack animations. A 7-step tour has at minimum 14 motion events (enter + exit per step), plus spotlight pulses and progress bar fills. Each one is mild on its own, but the cumulative effect is what triggers vestibular symptoms.

The approach I landed on:

1. **CSS media query for the first paint** — `@media (prefers-reduced-motion: reduce)` catches the preference before JS loads, so no flash of animation during hydration
2. **React hook for dynamic changes** — `usePrefersReducedMotion()` listens for live OS preference changes mid-session
3. **Reduce, don't remove** — Replace slide/scale transitions with opacity fades. Keep focus indicators and button feedback. The blanket `* { animation: none }` approach is an anti-pattern that removes helpful visual feedback
4. **In-tour toggle** — A `role="switch"` button inside the tour card itself for users who don't know about their OS accessibility settings

The testing angle was the part I found least documented. Playwright has `page.emulateMedia({ reducedMotion: 'reduce' })` built in, which makes CI testing straightforward.

Full writeup with code: https://usertourkit.com/blog/reduced-motion-product-tour

Curious if anyone else has dealt with the cumulative motion problem in multi-step flows, or if you've found better patterns for the SSR hydration edge case.
