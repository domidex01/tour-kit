## Title: Adding product tours to Next.js App Router -- handling Server Component boundaries

## URL: https://usertourkit.com/blog/nextjs-app-router-product-tour

## Comment to post immediately after:

Most React product tour libraries were built before Server Components existed. They wrap the entire component tree in a client-side provider and expect DOM access everywhere, which conflicts with App Router's Server Component defaults.

The approach here: a thin `'use client'` boundary around the tour provider, data attributes on Server Component markup for targeting, and a router adapter that wraps `next/navigation` for multi-page flows. The tour hydrates only the provider boundary -- everything else stays server-rendered.

We measured the overhead at ~12KB gzipped total (8KB core + 4KB React adapter). The library is headless, so there's no default CSS to fight with.

One limitation worth noting: no visual tour builder. Steps are defined in code/JSON. Teams that need drag-and-drop editing are better served by commercial tools.
