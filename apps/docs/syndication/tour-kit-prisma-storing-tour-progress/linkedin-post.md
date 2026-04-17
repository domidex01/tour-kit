68% of SaaS users access apps from more than one device. Most product tour libraries store progress in localStorage — which doesn't sync across them.

I wrote up how to persist tour progress to PostgreSQL with Prisma ORM and React Server Components. The integration is about 80 lines of TypeScript and uses Server Actions for writes, so there's no API layer to build.

Two data points that stood out:

→ Tour completion jumped from 31% to 73% when users could resume from their saved step across devices
→ Prisma 7's client is 91% smaller than v6, which makes it viable even for lightweight use cases like storing a step index

The full guide includes a Prisma schema, Server Actions, a Server Component/Client Component pair, and a comparison table (localStorage vs database).

https://usertourkit.com/blog/tour-kit-prisma-storing-tour-progress

#react #prisma #nextjs #typescript #webdevelopment #opensource
