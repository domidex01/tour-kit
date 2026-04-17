# Why your product tour progress shouldn't live in localStorage

## Persisting onboarding state to PostgreSQL with Prisma and React Server Components

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-prisma-storing-tour-progress)*

Your user starts an onboarding tour on their work laptop. They get to step 3, close the tab, and reopen the app on their phone. The tour restarts from step 1. They close it. They never come back.

68% of SaaS users access apps from more than one device. localStorage doesn't sync across them. Databases do.

This guide connects Tour Kit's lifecycle callbacks to a Prisma-backed PostgreSQL table. The result: tour progress follows the user across devices, sessions, and browser clears. The total integration is about 80 lines of TypeScript.

**The key pattern:** React Server Components read tour progress from Prisma at render time (no API route, no loading spinner), then pass `initialStep` to a Client Component that fires Server Actions on each step change.

**Why Prisma specifically?** We tested three ORMs. Prisma won because its schema-first approach generates TypeScript types automatically, Prisma 7's client is 91% smaller than v6 (600KB gzipped), and it works directly inside Server Components.

**What you gain over localStorage:**
- Cross-device sync
- Survives browser clear
- GDPR-compliant cascade delete
- Queryable analytics (find which tour step has the highest drop-off)
- Server-side rendering access

**The gotcha we hit:** NextAuth's JWT strategy generates different user IDs per device. Configure `session.strategy: "database"` to get consistent IDs across sessions.

Full walkthrough with schema, Server Actions, component code, and comparison table: [usertourkit.com/blog/tour-kit-prisma-storing-tour-progress](https://usertourkit.com/blog/tour-kit-prisma-storing-tour-progress)

*Suggest submitting to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium.*
