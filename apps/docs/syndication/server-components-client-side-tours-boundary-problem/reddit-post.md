## Subreddit: r/reactjs (primary), r/nextjs (secondary)

**Title:** I wrote up how React Server Components affect product tour architecture (the 'use client' boundary creates some non-obvious traps)

**Body:**

I've been building a headless tour library and ran into some interesting architectural challenges when adapting it for the App Router's Server Component model. Figured I'd write up the patterns that actually work.

The core problem: every tour provider, overlay, and tooltip must be a Client Component because they depend on useState, DOM measurement, and event handlers. But the 'use client' directive marks a module boundary, not just a component. Everything imported by a 'use client' file becomes client code too. If your tour provider imports an animation library, that library ships to the browser even if nothing else in your app needs it client-side.

The pattern that works: create a thin 'use client' wrapper, pass Server Components through as children (they stay server-rendered), and define tour step configs as serializable data in your Server Components. The Flight protocol handles serialization automatically. Callbacks like onStepComplete can't cross the boundary since functions aren't serializable, so those stay in the client wrapper.

I tested React Joyride, Shepherd.js, Onborda, and OnboardJS in a Next.js 15 + React 19 project. None of them document RSC-specific patterns. React Joyride ships ~37KB to the client. In an RSC app where everything else got smaller, that relative cost grows.

The hydration trap is also worth knowing about: if your tour conditionally renders based on localStorage state, you get hydration mismatches because the server can't predict the initial render. Gating on useEffect mount fixes this.

Full article with code examples and comparison table: https://usertourkit.com/blog/server-components-client-side-tours-boundary-problem

Disclosure: I built Tour Kit, one of the libraries compared. The article tries to be fair about tradeoffs.
