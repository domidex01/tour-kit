## Thread (6 tweets)

**1/** Most React tour libraries break in Next.js App Router because they assume a fully client-rendered tree. Here's how to make product tours work with Server Components.

**2/** The fix: wrap your tour provider in a `'use client'` boundary. Children stay server-rendered. The tour only hydrates the thin provider boundary -- not your entire layout.

**3/** Target elements using `data-tour` attributes. These work on Server Components because they're plain HTML. No hooks or client-side code needed on target elements.

**4/** For multi-page tours (onboarding from /dashboard to /settings), use a router adapter wrapping `usePathname()` and `useRouter()` from next/navigation. Each step gets a `route` property.

**5/** The whole setup is ~12KB gzipped. Headless, so you bring your own tooltip UI. Works with shadcn/ui, Radix, Tailwind, whatever you already use.

**6/** Full tutorial with TypeScript code examples: https://usertourkit.com/blog/nextjs-app-router-product-tour
