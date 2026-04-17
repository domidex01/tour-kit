## Thread (6 tweets)

**1/** I tested 4 product tour libraries under React Strict Mode.

All four break. Here's why — and a 5-point audit you can run in 2 minutes. 🧵

**2/** Tour libraries uniquely combine the worst patterns for Strict Mode:

- Singleton instances in effects (created twice)
- DOM overlay injection without cleanup (two overlays)
- Ref-guarded event listeners (React bug #24670 — refs don't clear on simulated unmount)
- Global scroll locks (page stays frozen)

**3/** React Joyride: overlay flickering documented in GitHub Discussions #805, #872, #973.

Atlassian's own onboarding spotlights broke after React 18 — "appearing in the top left of the screen."

If Atlassian couldn't handle it, your library probably can't either.

**4/** The hidden layer: React bug #24670 (unresolved since April 2024).

Strict Mode's simulated unmount does NOT clear ref.current. So even libraries with proper cleanup leak event listeners through the ref-guard pattern.

No article or roundup covers this.

**5/** 5-point audit — run these with StrictMode enabled:

1. Count overlay divs (should be 1)
2. Check Event Listeners tab after closing tour
3. Test scroll lock release
4. Hot reload mid-tour — step counter survive?
5. Watch console for findDOMNode warnings

**6/** Full breakdown with code examples, library-by-library analysis, and the unresolved ref bug:

https://usertourkit.com/blog/why-product-tour-libraries-break-strict-mode
