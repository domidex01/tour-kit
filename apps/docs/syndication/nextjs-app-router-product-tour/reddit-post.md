## Subreddit: r/reactjs

**Title:** I wrote a guide on adding product tours to Next.js App Router -- here's what I learned about Server Component boundaries

**Body:**

I spent a few weeks integrating product tour libraries into Next.js 15 App Router projects and kept running into the same problem: most tour libraries assume a fully client-rendered tree. They break when your layout is a Server Component.

The key insight is that your tour provider needs a `'use client'` boundary, but that doesn't force children to become Client Components. You can wrap your entire layout in a tour provider and everything below it stays server-rendered. The tour only hydrates the thin provider boundary.

For multi-page tours (onboarding that goes from /dashboard to /settings), you need a router adapter that wraps `useRouter()` and `usePathname()` from `next/navigation`. Without it, the tour loses track of which step to show after navigation.

Data attributes (`data-tour="sidebar"`) work on Server Components because they're plain HTML -- no hooks or client-side code needed on the target elements themselves.

I put together a full walkthrough with TypeScript code examples covering the provider setup, layout wrapping, headless tooltip rendering, and the multi-page router adapter: https://usertourkit.com/blog/nextjs-app-router-product-tour

Built this using userTourKit (our open-source headless tour library, ~8KB gzipped core). Happy to answer questions about the App Router integration patterns.
