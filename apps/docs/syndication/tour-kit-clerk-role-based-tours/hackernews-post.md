## Title: Role-based product tours with Clerk auth hooks and 30 lines of TypeScript

## URL: https://usertourkit.com/blog/tour-kit-clerk-role-based-tours

## Comment to post immediately after:

I built a headless product tour library for React (Tour Kit, <8KB gzipped) and wrote up how to connect it with Clerk's RBAC system for role-differentiated onboarding.

The core idea: Clerk's `useOrganization()` hook exposes `membership.role` and `membership.permissions`. Tour Kit's `when` prop on each step accepts a boolean function. Wire them together and admins see billing/team management steps while members see task creation steps. About 50 lines of glue code across 3 files.

A few things I found worth documenting:

1. Clerk's 8 system permissions are NOT included in session claims — you need custom permissions for this to work (easy to miss, cost me an hour of debugging)
2. Clerk's `publicMetadata` on the user object works well for persisting tour completion without a separate table, but the session token only refreshes every ~60 seconds
3. At 40K MAU, Clerk is $0/month vs Auth0's ~$2,275/month. Combined with an open-source tour library, this is a $0 role-based onboarding system.

Limitations: Tour Kit requires React 18+, has no visual builder, and Clerk caps custom roles at 10 per instance. If your product team needs WYSIWYG tour editing, this isn't the right approach.
