## Thread (6 tweets)

**1/** Every product tour tutorial assumes Next.js or Create React App. Nobody covers Remix. I wrote the guide that should exist. 🧵

**2/** The core problem: Remix loaders and actions are route-bound. Put your tour provider in a nested route and it unmounts on every navigation. Tour state gone.

Fix: place TourProvider in root.tsx above the Outlet. Route swaps, provider stays.

**3/** Persisting tour completion in Remix is actually clean. Create a resource route with an action, fire it with useFetcher().submit() when the tour ends. No full-page navigation, no state loss.

**4/** The gotcha nobody warns you about: Remix doesn't manage focus on route changes. Their own docs say so. For keyboard users in a multi-route tour, focus gets lost between navigation and tooltip render.

Solution: a FocusManager component that bridges the gap.

**5/** All of this works with React Router v7 too — Remix merged into RR7 in Dec 2024. Just swap your imports. React Router powers 7.8M GitHub projects including Shopify's 5M-line app.

**6/** Full tutorial with code, troubleshooting, and FAQ:

https://usertourkit.com/blog/remix-product-tour
