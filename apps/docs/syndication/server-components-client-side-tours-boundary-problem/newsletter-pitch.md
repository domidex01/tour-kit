## Subject: React Server Components and product tours: the boundary problem

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote up the architectural challenges of using product tour libraries with React Server Components. 45% of new React projects now use RSC, but most interactive widget libraries haven't documented how to handle the 'use client' boundary properly. The article covers the module-graph boundary semantics, serialization constraints (the Flight protocol), hydration mismatch traps, and a tested comparison of five tour libraries in a Next.js 15 + React 19 project.

Link: https://usertourkit.com/blog/server-components-client-side-tours-boundary-problem

Thanks,
Domi
