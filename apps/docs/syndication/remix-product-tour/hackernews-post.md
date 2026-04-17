## Title: Product Tours in Remix: Setup, Routing, and Best Practices

## URL: https://usertourkit.com/blog/remix-product-tour

## Comment to post immediately after:

There's a surprising gap in product tour content for Remix. Every tutorial assumes Next.js or CRA. Remix's loader/action architecture creates unique constraints — tour state can't live in arbitrary components the way it does in a fully client-rendered app.

The key insight: placing the tour provider in root.tsx above the Outlet means it survives nested route transitions. Tour completion persistence maps naturally to Remix resource routes via useFetcher.

One thing I didn't expect: Remix explicitly punts on focus management during route changes. Their accessibility guide acknowledges it but leaves the implementation to developers. For a multi-route tour, that means keyboard users lose their place between navigation and tooltip render. The article covers a FocusManager pattern that bridges the gap.

Also relevant: Remix merged into React Router v7 (December 2024), so the same patterns apply to both. React Router is used by 7.8M GitHub projects.
