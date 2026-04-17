## Title: Type-safe product tour configuration with tRPC and Zod

## URL: https://usertourkit.com/blog/trpc-product-tour-config

## Comment to post immediately after:

Most product tour libraries hardcode step definitions in the frontend. This works for simple cases but falls apart when you need to update tour content without redeploying, serve different steps to different user roles, or validate step configuration before it reaches the client.

This article walks through serving tour step configs from a tRPC backend with Zod validation. The Zod schema defines step structure once, tRPC carries the types end-to-end, and TanStack Query handles client-side caching. The whole integration is about 40 lines of TypeScript.

Performance-wise, a 12-step tour config resolves in 3-8ms cold from Postgres, under 1ms on cached reads. The JSON payload is roughly 1.2KB gzipped for a full tour.

The comparison table in the article covers tRPC vs REST vs GraphQL vs Next.js Server Actions for this specific use case. tRPC wins on developer experience (no codegen, automatic types) but requires a TypeScript backend.

Disclosure: I built the tour library used in the examples. The pattern itself works with any library that accepts a steps array.
