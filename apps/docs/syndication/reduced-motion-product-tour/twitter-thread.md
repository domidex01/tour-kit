## Thread (6 tweets)

**1/** 35% of US adults over 40 have experienced vestibular dysfunction. Product tours stack 14+ motion events across a typical flow. None of the major onboarding tools mention prefers-reduced-motion in their 2026 guides.

**2/** The common fix is `* { animation: none !important }`. That's wrong. It kills focus ring animations, loading spinners, and button feedback. "Reduced motion" means reduce, not remove.

**3/** The right pattern: replace spatial transforms (slide-ins, scale effects, pulsing spotlights) with opacity fades and static rings. Keep micro-interactions that provide useful feedback.

**4/** One gotcha: React hooks detect the preference after first paint. CSS media queries catch it before JS loads. You need both — `@media (prefers-reduced-motion: reduce)` for first paint, `usePrefersReducedMotion()` for dynamic changes.

**5/** Not everyone knows where to find the OS reduced motion toggle. macOS buries it in System Settings > Accessibility > Display. An in-tour `role="switch"` toggle catches users who need it but haven't found the setting.

**6/** Full tutorial with React hook code, Tailwind patterns, Playwright CI tests, and a Vitest matchMedia mock:

https://usertourkit.com/blog/reduced-motion-product-tour
