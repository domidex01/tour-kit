## Subreddit: r/reactjs

**Title:** I wrote a guide on adding product tours to Remix apps — nested routes, server persistence, and focus management

**Body:**

I've been working on a product tour library and wanted to document how it works with Remix specifically, since every tutorial I found targets Next.js or Create React App.

The main challenge with Remix is that loaders and actions are route-bound, not component-bound. If your tour provider lives inside a nested route, it unmounts when the user navigates away and you lose all tour state. The fix is placing the provider in `root.tsx` above the Outlet, so it survives route swaps.

The other thing I didn't see covered anywhere: focus management during multi-route tours. Remix doesn't handle focus on route transitions (their own docs acknowledge this). If your tour navigates a keyboard user from `/dashboard` to `/settings`, focus gets lost between the route change and the tooltip appearing. The article covers a FocusManager pattern that bridges that gap.

Other things covered: persisting tour completion through Remix resource routes with useFetcher, the route field on step configs for cross-route navigation, hydration timing gotchas with the spotlight overlay, and what changes when migrating to React Router v7.

The patterns also work with React Router v7 in framework mode since the two merged in December 2024.

Full article with all the code: https://usertourkit.com/blog/remix-product-tour

Happy to answer questions about the implementation or any Remix-specific gotchas.
