## Thread (6 tweets)

**1/** React Joyride was declared "dead" by Snyk, competitor blogs, and automated health checks.

Then V3 shipped — a complete rewrite with 3 releases in 9 days.

Here's what actually happened:

**2/** The gap: No releases from Nov 2024 to Mar 2026. During that time, React 19 broke V2 (removed APIs it depended on). Snyk flagged it as "could be considered discontinued."

Meanwhile, the maintainer was silently building V3 from scratch.

**3/** What V3 fixed:
- React 19 support (was completely broken)
- Floating UI replaces Popper.js
- useJoyride() hook replaces getHelpers callback
- SVG overlays instead of CSS box-shadow
- ~30% smaller bundle

**4/** What V3 didn't fix:
- Inline styles only (Tailwind users still fight it)
- Touch device double-tap bug
- Multi-instance conflicts
- Solo maintainer (bus factor = 1)

**5/** The meta-story is interesting: automated health scoring created a negative feedback loop.

Library goes quiet during rewrite → score drops → competitors cite the score → devs switch → library ships V3 to a smaller audience.

**6/** Full breakdown with release timeline, V2 vs V3 comparison table, and alternatives analysis:

https://usertourkit.com/blog/is-react-joyride-still-maintained

(Disclosure: I build User Tour Kit, a headless alternative. Bias disclosed in the article.)
