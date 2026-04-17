## Subject: Persisting product tour state to PostgreSQL with Prisma + RSC

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a guide on replacing localStorage-based tour progress with a Prisma + PostgreSQL approach in Next.js App Router. The pattern uses React Server Components for reads (0KB client impact) and Server Actions for writes, with Prisma 7's 91%-smaller TypeScript client.

The interesting finding: tour completion jumped from 31% to 73% when users could resume from their saved step across devices.

Link: https://usertourkit.com/blog/tour-kit-prisma-storing-tour-progress

Thanks,
Domi
