## Thread (6 tweets)

**1/** I tried building a product tour with web components for framework portability. Shadow DOM made it a nightmare. Here's what happened:

**2/** Problem 1: Overlays. Each shadow root creates its own stacking context. A tour overlay inside a shadow root can't sit above elements in other shadow roots. React portals solve this in one line.

**3/** Problem 2: Focus trapping. WCAG requires modal overlays to trap keyboard focus. Shadow DOM hides elements from querySelectorAll. Closed shadow roots? Completely invisible. React just works here.

**4/** Problem 3: Styling. Want Tailwind on your tour tooltip inside shadow DOM? You need a separate Tailwind build scoped to that root. CSS custom properties help for colors but that's about it.

**5/** The fix: framework-agnostic core logic (pure TS) + framework-specific rendering. That's what Tour Kit does — @tourkit/core is portable, @tourkit/react handles the rendering. Best of both worlds without shadow DOM pain.

**6/** Full deep-dive with bundle size comparison and code examples: https://usertourkit.com/blog/web-components-vs-react-product-tour

Web components are great for leaf UI. For orchestration-heavy UI like tours, React's model wins.
