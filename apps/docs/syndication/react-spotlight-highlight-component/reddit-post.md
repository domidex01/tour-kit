## Subreddit: r/reactjs

**Title:** I built an accessible spotlight overlay from scratch — here's why clip-path beats mix-blend-mode

**Body:**

I was building a feature highlight overlay for an onboarding flow and kept running into the same problem: every tutorial uses `mix-blend-mode: hard-light` for the dimming effect, but it breaks in dark mode and with branded backdrops. React Joyride uses this approach and has dozens of open issues about it.

So I wrote up how to build one from scratch using CSS `clip-path` instead. The polygon draws a full-viewport overlay with a rectangular cutout around the target element. It's GPU-accelerated, dark-mode safe, and adds 0KB to your bundle (native CSS).

The tutorial also covers things most spotlight guides skip entirely:
- React portals to avoid z-index/stacking context traps
- `inert` attribute for background content (not just aria-hidden)
- Focus trapping that actually works with Tab + Shift+Tab
- `prefers-reduced-motion` for animation gating
- ResizeObserver to keep the spotlight locked when layouts shift

I also put together a comparison table: clip-path vs mix-blend-mode vs box-shadow vs SVG mask, with tradeoffs for each.

Full article with all the code: https://usertourkit.com/blog/react-spotlight-highlight-component

Happy to answer questions about the approach. The `inert` attribute in particular was a nice discovery for modal-like overlays.
