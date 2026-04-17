## Title: React Server Components and client-side tours: the boundary problem

## URL: https://usertourkit.com/blog/server-components-client-side-tours-boundary-problem

## Comment to post immediately after:

Author here. This article came out of adapting a product tour library for React Server Components. The 'use client' boundary creates some non-obvious architectural traps that I hadn't seen documented anywhere.

The key insight: 'use client' marks a module dependency boundary, not a render tree boundary. Everything imported by a 'use client' file becomes client code. Most tour libraries tell you to wrap your entire app in a provider, and if that provider imports heavy dependencies, RSC's bundle reduction benefit erodes.

The serialization constraint is also interesting. The React Flight protocol can't send functions, so you end up with a natural split: tour step configurations (text, selectors, IDs) live in Server Components as serializable data, while callbacks and event handlers stay in thin client wrappers.

I tested five tour libraries in Next.js 15 + React 19. None document RSC-specific patterns. The article covers the architectural patterns that work, hydration mismatch traps, and bundle size comparisons between traditional SPAs and RSC-enabled apps.

Disclosure: I built one of the libraries compared (Tour Kit). The article acknowledges this and tries to be honest about competitor strengths.
