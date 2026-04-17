---
title: "Tour Kit + Prisma: storing tour progress in your database"
slug: "tour-kit-prisma-storing-tour-progress"
canonical: https://usertourkit.com/blog/tour-kit-prisma-storing-tour-progress
tags: react, prisma, nextjs, typescript, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-prisma-storing-tour-progress)*

# Tour Kit + Prisma: storing tour progress in your database

Your user starts an onboarding tour on their work laptop. They get to step 3, close the tab, and reopen the app on their phone. The tour restarts from step 1.

That's what happens when tour progress lives in `localStorage`. This guide wires Tour Kit's callbacks into a Prisma-backed PostgreSQL table so progress follows the user, not the browser. About 80 lines of TypeScript across three files.

```bash
npm install @tourkit/core @tourkit/react @prisma/client prisma
```

The full article with schema, Server Actions, Server Component/Client Component code, comparison table (localStorage vs database), and FAQ is at: [usertourkit.com/blog/tour-kit-prisma-storing-tour-progress](https://usertourkit.com/blog/tour-kit-prisma-storing-tour-progress)

Key data points:
- Prisma 7 client: 600KB gzipped (91% smaller than v6)
- Single-row lookup: under 2ms on warm connection
- Client bundle impact: ~1.2KB (Tour Kit provider + Server Action imports)
- Database read: 0KB client impact (runs server-side via RSC)
- Tour completion: 73% when users resume from saved step vs 31% when restarting
