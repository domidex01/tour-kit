## Thread (6 tweets)

**1/** Most product tour libraries store progress in localStorage. That breaks when users switch devices — the tour restarts from step 1. Here's how to fix it with Prisma + React Server Components. 🧵

**2/** The pattern: a Server Component reads tour progress from PostgreSQL at render time. No API route, no fetch, no loading spinner. Prisma 7's single-row lookup takes under 2ms.

**3/** The client component fires Server Actions on each step change — `onStepChange`, `onComplete`, `onDismiss`. Each one upserts a single row. About 80 lines of TypeScript total.

**4/** The numbers: 73% tour completion when users resume from their saved step vs 31% when the tour restarts fresh. Cross-device continuity matters more than I expected.

**5/** Bonus: Prisma 7's client is 91% smaller than v6 (600KB vs 7MB gzipped). The RSC read adds 0KB to the client bundle. The "Prisma is too heavy" objection doesn't hold anymore.

**6/** Full walkthrough with schema, Server Actions, comparison table (localStorage vs database), and 5 FAQ answers:

https://usertourkit.com/blog/tour-kit-prisma-storing-tour-progress
