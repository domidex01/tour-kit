## Thread (6 tweets)

**1/** Your admin dashboard has 40 features. Your viewer can access 6. Why are you showing them the same onboarding tour?

Personalized onboarding increases adoption by 42%. Here's how to build role-based tours in React: 🧵

**2/** The core pattern is a `when` callback on each step:

```
when: forRoles('admin')
```

Tour Kit evaluates it before each transition. Returns false? Step gets skipped. Progress bar adjusts. No phantom steps.

**3/** The bridge between your auth provider and tour logic is one line:

```
setData('userRole', user.role)
```

Every `when` callback reads from `context.data`. Works with Clerk, Auth.js, Supabase, or plain React Context.

**4/** What each role actually sees:

Admin → 6 steps (billing, team mgmt, content, media, welcome, help)
Editor → 4 steps (content, media, welcome, help)
Viewer → 3 steps (entirely separate tour)

Same codebase. Zero conditional rendering.

**5/** The gotcha nobody mentions: client-side role filtering is NOT security. A user can open browser console and change their role.

Always enforce permissions server-side. The tour is cosmetic. Your API is the security boundary.

**6/** Full tutorial with 6 working TypeScript code examples, troubleshooting, and FAQ:

https://usertourkit.com/blog/conditional-product-tour-user-role

Covers role guards, mid-session role changes, separate vs. filtered tours, and focus management.
