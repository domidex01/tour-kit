# Server Components and Client-Side Tours: The Boundary Problem

## React Server Components break most product tour libraries. Here's the architecture that fixes it.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/server-components-client-side-tours-boundary-problem)*

React Server Components changed where code runs. Product tours need useState, useEffect, DOM measurement, event handlers, and localStorage, all things that only exist in the browser. When a framework defaults every component to server rendering, your tour library has a problem.

As of April 2026, 45% of new React projects use Server Components (Strapi / State of React 2025), and most tour libraries haven't adapted.

## The core conflict

The boundary problem is the architectural conflict between Server Components (zero client JavaScript) and product tour libraries (require browser APIs for everything). Every tour provider, tooltip, and highlight component must be a Client Component.

The real question isn't whether tours can work with RSC. They can. It's how much of your app you accidentally pull into the client bundle when you add them.

## Why 'use client' matters more than you think

The 'use client' directive doesn't just mark one file as client-side. It defines a boundary on the module dependency graph. Any module imported into that file also becomes a Client Component.

Smashing Magazine's RSC forensics article puts it directly: "Client Components can only explicitly import other Client Components."

Most tour libraries tell you to wrap your entire application in a provider. If that provider imports animation libraries, utility functions, or UI components, all of that code ends up in the client bundle.

## The pattern that works

A Server Component can be a child of a Client Component when passed as children props. This is the escape hatch.

The architecture: create a thin 'use client' wrapper for the tour provider, keep page layouts as Server Components, and pass server-rendered content through via children. The children don't become Client Components.

Define tour step configurations (text, target selectors, IDs) as plain data in Server Components. Pass them as props to the client provider. The React Flight protocol serializes this automatically. Callbacks like onStepComplete must stay in Client Components because functions can't cross the boundary.

## Hydration traps

Tour libraries that conditionally render based on localStorage state hit hydration mismatches. The server can't predict whether to show the tour. Solution: gate tour UI rendering on useEffect mount. Render nothing on the server, show the tour after the component mounts on the client.

## The library landscape

We tested five tour libraries in Next.js 15 with React 19. None document RSC-specific patterns as of April 2026. React Joyride and Shepherd.js predate Server Components entirely. Onborda was built for Next.js but requires Framer Motion (~32KB additional client JavaScript).

Tour Kit takes a different approach with a thin client provider (~8KB core), using the children slot pattern by default. Disclosure: we built Tour Kit.

## Bundle impact

Adding a product tour costs the same client JavaScript regardless of rendering strategy. But RSC makes everything around the tour leaner. Tour step configuration data serializes through the Flight protocol instead of being imported as a JavaScript module, contributing 0 KB to the client bundle.

The relative impact of a heavy tour library grows as your baseline shrinks. React Joyride at ~37KB is a bigger percentage of your remaining client JavaScript when RSC has already reduced everything else.

## Key takeaways

1. Isolate the client boundary. One 'use client' file for the tour provider.
2. Pass config as serializable props from Server Components.
3. Use the children slot to keep page content server-rendered.
4. Gate tour rendering on useEffect to avoid hydration mismatches.
5. Co-locate tour steps with pages instead of a global registry.

The server-client boundary is a permanent part of React's architecture. Building with clear boundaries now is the right long-term strategy.

---

*Suggested Medium publications: JavaScript in Plain English, Bits and Pieces, Better Programming*
