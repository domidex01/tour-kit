## Subreddit: r/reactjs

**Title:** I wrote a tutorial on building role-based product tours in React (admin vs editor vs viewer see different steps)

**Body:**

Every SaaS dashboard I've worked on has multiple user roles, but every product tour tutorial I've found shows the same steps to everyone. Admins get walked through buttons viewers can't click. Viewers see features they'll never access.

I wrote up the pattern I've been using to solve this. The core idea: a `when` callback on each tour step that checks the user's role from React Context. Steps where the callback returns `false` get skipped entirely, and the progress bar adjusts automatically.

The tutorial covers:

- A `forRoles('admin', 'editor')` helper that keeps step configs readable
- Wiring user roles from your auth provider into tour context via `setData()`
- Handling role changes mid-tour (upgrades, permission grants) with `useRef` to avoid re-render cascades
- When to use filtered steps vs. entirely separate tour definitions per role
- A comparison table showing what each role actually sees

One thing I want to be upfront about: the code uses Tour Kit, which is a library I built. But the `when` callback pattern works with any tour library that supports conditional steps. The architectural pattern is what matters.

Personalized onboarding increases adoption by 42% according to UserGuiding's 2026 data. That stat alone convinced me to write this up properly.

Full article with 6 working code examples and troubleshooting: https://usertourkit.com/blog/conditional-product-tour-user-role

Happy to answer questions about the implementation or discuss alternative approaches.
