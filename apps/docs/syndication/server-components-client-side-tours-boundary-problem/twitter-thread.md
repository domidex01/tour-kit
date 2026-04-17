## Thread (6 tweets)

**1/** 45% of new React projects use Server Components, but most product tour libraries haven't adapted. I wrote up the architectural problem and the patterns that actually work.

**2/** The core issue: every tour component needs useState, DOM APIs, and event handlers. All client-only. But 'use client' marks a MODULE BOUNDARY, not just a component. Everything imported by that file ships to the client too.

**3/** Most tour libraries tell you to wrap your app in a provider. If that provider imports animation libs or UI components, RSC's bundle savings start eroding. React Joyride ships ~37KB to the client. In an RSC app where everything else got smaller, that relative cost grows.

**4/** The pattern that works: thin 'use client' wrapper + children slot. Server Components pass THROUGH Client Components as children without becoming client code. Define tour step configs as serializable data on the server. Callbacks stay on the client.

**5/** Tested 5 tour libraries in Next.js 15 + React 19. None document RSC patterns. None address the hydration mismatch trap (rendering tours conditionally from localStorage = server/client mismatch).

**6/** Full breakdown with code examples, comparison table, and the architectural pattern: https://usertourkit.com/blog/server-components-client-side-tours-boundary-problem
