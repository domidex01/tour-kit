## Subreddit: r/reactjs (also suitable for r/nextjs)

**Title:** I wrote up how to wire Clerk's useOrganization hook into product tour step filtering — 30 lines of TypeScript

**Body:**

I've been building a headless product tour library (Tour Kit) and kept getting asked how to show different tour steps to different user roles. Most React tour libraries treat every user the same — admin and viewer see the same 12 steps.

Clerk's `useOrganization()` hook returns `membership.role` and `membership.permissions` directly. Tour Kit has a `when` prop on each step that accepts a boolean function. Connecting them is straightforward:

```tsx
{
  id: "billing",
  target: "#billing-section",
  title: "Billing and subscription",
  when: () => ctx.hasPermission("org:billing:manage"),
}
```

Steps where `when` returns `false` are removed before the tour engine processes them — no DOM queries fire, and the step counter re-indexes automatically (so members see "Step 1 of 3" instead of "Step 2 of 5").

One gotcha worth calling out: Clerk's 8 system permissions (`org:sys_profile:manage`, etc.) are NOT included in session claims. You need custom permissions for this pattern to work. Spent a while debugging that one.

The integration is about 50 lines across 3 files. I also covered persisting tour completion in Clerk's `publicMetadata` (saves you a database table), lazy-loading the tour to manage combined bundle size (Clerk's SDK is ~1 MB uncompressed), and how Role Sets (January 2026) enable tiered tours per org plan.

Full article with all the TypeScript code: https://usertourkit.com/blog/tour-kit-clerk-role-based-tours

Happy to answer questions about the approach or discuss alternative patterns.
