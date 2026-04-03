# How to add a product tour to a Next.js project

## Server Components broke your tour library -- here's how to fix it

*Originally published at [usertourkit.com](https://usertourkit.com/blog/nextjs-app-router-product-tour)*

Next.js App Router splits your application into Server Components and Client Components. Most product tour libraries expect a fully client-rendered tree and break when you try to wrap a Server Component layout.

userTourKit is a headless React tour library that works inside `'use client'` boundaries without touching your Server Component layout. The core package is under 8KB gzipped.

## The setup (3 files)

**1. Install the packages:**

`npm install @tourkit/core @tourkit/react`

**2. Create a client-side tour provider** with `'use client'` at the top. Define your steps with `target` selectors pointing to `data-tour` attributes on your UI elements.

**3. Wrap your root layout** with the provider. Server Components nested inside still stay server-rendered -- the `'use client'` boundary doesn't force children to become client code.

**4. Build your tooltip** using the `useTour()` hook which gives you `currentStep`, `next`, `prev`, `stop`, and `progress`.

## Multi-page tours

For onboarding flows that span `/dashboard` to `/settings`, use the `useNextAppRouter()` adapter. Add a `route` property to each step definition and the library handles navigation automatically.

## How it compares

userTourKit is headless (you bring your own UI), works with any React router, and bundles at ~12KB total. React Joyride ships at ~15KB with opinionated CSS. Onborda is Next.js-specific and requires Framer Motion.

The tradeoff: no visual builder. You define tours in code. For teams that want drag-and-drop, commercial tools like Appcues start at $249/month.

Full tutorial with code examples: [usertourkit.com/blog/nextjs-app-router-product-tour](https://usertourkit.com/blog/nextjs-app-router-product-tour)

*Suggested publications: JavaScript in Plain English, Better Programming*

canonical_url: https://usertourkit.com/blog/nextjs-app-router-product-tour
