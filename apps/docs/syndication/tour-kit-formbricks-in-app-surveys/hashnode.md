---
title: "Tour Kit + Formbricks: in-app surveys after tour completion"
slug: "tour-kit-formbricks-in-app-surveys"
canonical: https://usertourkit.com/blog/tour-kit-formbricks-in-app-surveys
tags: react, javascript, web-development, open-source
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-formbricks-in-app-surveys)*

# Tour Kit + Formbricks: in-app surveys after tour completion

A user finishes your five-step dashboard tour. They click "Done," the spotlight fades, and three seconds later a small popover asks: "How easy was it to find the export button?" That question, asked at exactly the right moment, generates 3-4x higher response rates than a random email survey two days later.

The problem is wiring the two systems together. Tour Kit handles the tour lifecycle. Formbricks handles survey creation, targeting, and response collection. You need about 40 lines of glue code to connect them.

We built this integration in a Next.js 15 app. The three gotchas we hit: Formbricks's SDK initialization is async, the survey trigger timing matters more than you'd expect, and you need to handle the case where a user dismisses the tour early.

```bash
npm install @tourkit/core @tourkit/react @formbricks/js
```

Full tutorial with code examples, edge case handling, and a comparison table between Formbricks and Tour Kit's built-in surveys: [Read the full article](https://usertourkit.com/blog/tour-kit-formbricks-in-app-surveys)
