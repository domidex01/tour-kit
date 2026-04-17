## Thread (6 tweets)

**1/** Your admin and your viewer shouldn't see the same product tour. Here's how to wire Clerk's RBAC into per-role onboarding with ~30 lines of TypeScript: 🧵

**2/** Clerk's useOrganization() hook gives you membership.role and membership.permissions directly in React. Tour Kit's `when` prop on each step accepts a boolean function. Connect them and admins see billing steps, members see task creation steps.

**3/** One gotcha that cost me an hour: Clerk's 8 system permissions are NOT in session claims. You need custom permissions (org:billing:manage format) for tour step gating. Documented but buried in their RBAC guide.

**4/** Cost comparison at 40K MAU:
- Clerk + Tour Kit: $0/mo
- Auth0 + React Joyride: ~$2,275/mo
- Clerk + Appcues: ~$300/mo
- WalkMe: ~$15K+/year

Role-based onboarding doesn't have to be expensive.

**5/** Bonus: persist tour completion in Clerk's publicMetadata instead of a separate DB table. Just know the session token refreshes every ~60 seconds, so call user.reload() if you need instant updates.

**6/** Full tutorial with TypeScript code, comparison table, lazy-loading optimization, and FAQ:

https://usertourkit.com/blog/tour-kit-clerk-role-based-tours
