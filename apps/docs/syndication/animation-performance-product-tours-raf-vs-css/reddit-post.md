## Subreddit: r/reactjs

**Title:** requestAnimationFrame vs CSS for tooltip positioning — what we learned profiling product tour animations

**Body:**

I spent a while profiling animation performance in product tours (those step-by-step tooltip walkthroughs you see in SaaS apps) and wanted to share what I found, because most articles frame this as a binary choice when it's really not.

**The short version:** CSS transitions on `transform`/`opacity` handle 80% of tour animation needs at zero main-thread cost because they run on the GPU compositor thread. But CSS can't track scroll position, so when a tooltip needs to follow a moving anchor element, you need `requestAnimationFrame`. In production, most tours need both working together: rAF computes the new position, CSS applies it via `transform`.

**The surprising finding:** implicit compositing. A tour tooltip animated at z-index 9999 forces every higher-stacked element in the host app onto its own GPU layer. I measured 3 layers in an isolated demo vs 14 in a production dashboard. Each 320x240 layer costs ~307KB of GPU memory, multiplied by 9 on 3x mobile screens. This is why tours "work in dev, jank in production."

**Another antipattern:** some tour libraries animate spotlights by updating CSS custom properties (`--spotlight-x`, `--spotlight-y`) every frame via rAF. This forces style recalculation across every inheriting element. One documented case hit 8ms/frame on 1,300+ elements — the entire 120fps budget gone on a single recalc.

**The decision tree I landed on:**
1. CSS transitions for tooltip appear/disappear (compositor thread)
2. rAF only for scroll-synced anchor tracking (read position, write transform)
3. Web Animations API for controllable transitions (pause/resume/reverse without main thread)
4. Never animate width/height/top/left in overlays
5. Never update CSS variables per frame for spotlight positioning

Full writeup with code examples, a prefers-reduced-motion reference table, and WAAPI patterns: https://usertourkit.com/blog/animation-performance-product-tours-raf-vs-css

Happy to answer questions about any of the profiling methodology.
