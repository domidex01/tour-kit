## Subreddit: r/reactjs

**Title:** I wrote up how to persist product tour progress to PostgreSQL with Prisma + Server Components (instead of localStorage)

**Body:**

Most product tour libraries store progress in localStorage. That works until your user switches devices or clears their browser — then the tour restarts from step 1.

I put together a guide on wiring Tour Kit's lifecycle callbacks (`onStepChange`, `onComplete`) into a Prisma-backed PostgreSQL table via Server Actions. The pattern is about 80 lines of TypeScript across three files:

1. A Prisma schema with a compound unique on `userId` + `tourId`
2. Server Actions that upsert progress on each step change
3. A Server Component that reads progress at render time (no API route, no fetch, no loading state) and passes `initialStep` to the client

A few things I found interesting while building it:

- Prisma 7's client is 91% smaller than v6 (600KB gzipped vs 7MB), which made me reconsider using it for lightweight use cases like this
- The RSC read adds 0KB to the client bundle since it runs entirely server-side
- We measured 73% tour completion when users resumed from their saved step vs 31% when the tour restarted fresh

The main gotcha: if you're using NextAuth with JWT strategy, it generates different user IDs per device. You need `session.strategy: "database"` for consistent IDs across sessions.

Full article with code, comparison table (localStorage vs database), and FAQ: https://usertourkit.com/blog/tour-kit-prisma-storing-tour-progress

Happy to answer questions about the implementation.
