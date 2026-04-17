Most SaaS apps show every user the same onboarding tour. Your admin sees task creation steps they'll never use. Your viewer gets walked through settings they can't access.

I wrote up how to fix this using two libraries that already exist in most React/Next.js stacks: Clerk for auth context and Tour Kit for the tour engine.

The connection is ~30 lines of TypeScript. Clerk's useOrganization() hook exposes roles and permissions. Tour Kit's `when` prop filters steps per user. Admins see 4 steps, members see 3, each custom role gets a tailored subset.

At 40K MAU, the total cost is $0/month — Clerk's free tier covers 50K users and Tour Kit is MIT open-source. Enterprise equivalents (WalkMe, Appcues) start at $300-$1,250/month for similar functionality.

Full tutorial with code: https://usertourkit.com/blog/tour-kit-clerk-role-based-tours

#react #typescript #saas #productdevelopment #onboarding #opensource
