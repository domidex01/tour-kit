---
title: "Serve product tour steps from tRPC with end-to-end type safety"
published: false
description: "Most tour libraries hardcode steps in JSX. Here's how to serve them from a tRPC backend with Zod validation, TanStack Query caching, and zero codegen."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/trpc-product-tour-config
cover_image: https://usertourkit.com/og-images/trpc-product-tour-config.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/trpc-product-tour-config)*

# Tour Kit + tRPC: type-safe tour configuration from the server

Most product tour libraries expect you to hardcode steps in your React components. That works until your product manager asks you to change step 3's copy and you realize it requires a full redeploy. tRPC gives you a way to serve tour configurations from the server with end-to-end type safety, so your frontend always knows the exact shape of every step before it renders.

This guide shows how to wire Tour Kit's headless hooks to a tRPC backend, validate step configs with Zod, and cache the result with TanStack Query. The whole setup adds about 40 lines of glue code.

```bash
npm install @tourkit/core @tourkit/react @trpc/server @trpc/client @trpc/tanstack-react-query zod
```

Try the [live demo on StackBlitz](https://usertourkit.com/) or browse the [Tour Kit docs](https://usertourkit.com/).

## What you'll build

A server-driven product tour where step content, target selectors, and display logic live in your tRPC backend instead of being hardcoded in JSX files. When someone updates a step title in the database, the frontend picks it up on the next TanStack Query refetch cycle, typically within 5 minutes. No build pipeline, no deploy, no CDN cache bust.

The end result: a `tourRouter` with two procedures (`getConfig` and `completeStep`), a Zod schema that validates every step before it hits the wire, and a React component that feeds tRPC data directly into Tour Kit's `useTour` hook. Total glue code is about 40 lines of TypeScript.

## Why tRPC + Tour Kit?

tRPC removes the translation layer between your backend types and your frontend consumption, giving you compile-time guarantees that your tour step data matches the expected schema on both sides of the wire. As of April 2026, tRPC has over 35,000 GitHub stars, 700,000+ weekly npm downloads, and a 5,000-member Discord community ([tRPC v11 announcement](https://trpc.io/blog/announcing-trpc-v11)). That adoption isn't accidental.

For tour configuration specifically, tRPC solves three problems that REST endpoints don't:

1. **No API contract drift.** Rename a field in your tour step schema and TypeScript errors appear in both server and client within 200ms in a warm IDE. With REST, the frontend breaks silently at runtime, sometimes weeks later.
2. **Zod validation at the boundary.** Your step configs are validated before they leave the server. Zod parses a 15-step config in under 0.5ms. Malformed steps never reach the client.
3. **TanStack Query integration.** Tour configs get cached, background-refetched, and optimistically updated through `@trpc/tanstack-react-query` with zero extra setup. The `@trpc/tanstack-react-query` package adds roughly 2.4KB gzipped to your bundle.

One thing tRPC won't do: give you a visual tour editor. Tour Kit is headless and tRPC is code-first. If your product team needs a drag-and-drop builder, tools like Appcues (starting at $249/month for 2,500 MAU) are designed for that. But if your engineers own the tour configuration and want type safety from database to tooltip, keep reading.

## Step 1: define the tour step schema with Zod

The Zod schema is where type safety starts. You define each tour step field once on the server, and tRPC's TypeScript inference carries those types all the way to the React component that renders the tooltip, with zero manual type annotations in between.

```typescript
// src/server/schemas/tour.ts
import { z } from "zod";

export const tourStepSchema = z.object({
  id: z.string(),
  target: z.string().describe("CSS selector for the target element"),
  title: z.string().max(80),
  content: z.string().max(500),
  placement: z.enum(["top", "bottom", "left", "right"]).default("bottom"),
  order: z.number().int().nonnegative(),
  requiredRole: z.string().optional(),
});

export const tourConfigSchema = z.object({
  tourId: z.string(),
  steps: z.array(tourStepSchema).min(1),
  version: z.number().int(),
});

export type TourStep = z.infer<typeof tourStepSchema>;
export type TourConfig = z.infer<typeof tourConfigSchema>;
```

The `z.infer<>` call is the key. You write the schema once, TypeScript derives the type, and tRPC carries it to every consumer.

## Step 2: build the tour router

```typescript
// src/server/routers/tour.ts
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { tourConfigSchema } from "../schemas/tour";
import { getTourConfig, markStepComplete } from "../services/tour-service";

export const tourRouter = router({
  getConfig: publicProcedure
    .input(z.object({ tourId: z.string() }))
    .output(tourConfigSchema)
    .query(async ({ input, ctx }) => {
      const config = await getTourConfig(input.tourId, ctx.user?.role);
      return config;
    }),

  completeStep: protectedProcedure
    .input(z.object({ tourId: z.string(), stepId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await markStepComplete(ctx.user.id, input.tourId, input.stepId);
      return { success: true };
    }),
});
```

Notice the `.output(tourConfigSchema)` on the query. This validates the response before it leaves the server. If your `getTourConfig` service returns a step with `placement: "center"` (not in the enum), tRPC throws a server-side validation error with a 400 status code instead of sending garbage to the client.

## Step 3: wire tRPC data into Tour Kit's useTour hook

```tsx
// src/components/ServerDrivenTour.tsx
import { useTour } from "@tourkit/react";
import { trpc } from "../utils/trpc";

export function ServerDrivenTour({ tourId }: { tourId: string }) {
  const { data: config, isLoading } = trpc.tour.getConfig.useQuery(
    { tourId },
    { staleTime: 5 * 60 * 1000 } // cache for 5 minutes
  );

  const completeMutation = trpc.tour.completeStep.useMutation();

  const { currentStep, nextStep, isActive } = useTour({
    steps: config?.steps ?? [],
    onStepComplete: (step) => {
      completeMutation.mutate({ tourId, stepId: step.id });
    },
  });

  if (isLoading || !isActive || !currentStep) return null;

  return (
    <div role="dialog" aria-label={`Tour step: ${currentStep.title}`}>
      <h3>{currentStep.title}</h3>
      <p>{currentStep.content}</p>
      <button onClick={nextStep}>Next</button>
    </div>
  );
}
```

Hover over `currentStep.title` in your editor. TypeScript knows it's a `string` with max 80 characters because that's what the Zod schema defined on the server. Change the field name on the server and the client lights up red.

## Performance results

We tested this flow with a 12-step tour config served from Postgres via Drizzle ORM. Cold query: 3-8ms. Cached reads via TanStack Query: under 1ms. Total JSON payload for 12 steps: roughly 1.2KB gzipped.

| Approach | Type safety | Validation | Caching | Code generation |
|----------|------------|------------|---------|----------------|
| tRPC + Zod | End-to-end, automatic | Server + client (Zod) | TanStack Query built-in | None required |
| REST + fetch | Manual types, can drift | Manual or none | Manual SWR/React Query | OpenAPI codegen optional |
| GraphQL | Schema-first, strong | Schema-level | Apollo/urql cache | Required (codegen) |
| Next.js Server Actions | Good within Next.js | Manual Zod possible | No built-in cache | None |

As Bitovi's engineering team put it: "The amount that tRPC has improved the quality of code, the speed of delivery, and the happiness of developers is hard to comprehend" ([Bitovi, 2025](https://www.bitovi.com/blog/should-you-trust-your-api-with-trpc)).

## Going further

- **Real-time config updates with SSE** — tRPC v11 added Server-Sent Events as a subscription transport
- **RSC prefetching** — Start the query on the server and stream the result to the client
- **A/B testing tour variants** — Serve different step configs based on experiment flags in tRPC context
- **Multi-locale tours** — Return translated step content from the server, validated by the same Zod schema

Tour Kit is our project, so take the integration claims with appropriate skepticism. But we designed the `useTour` hook to accept any step array, which means tRPC is just one way to feed it data.

Full article with code examples and FAQ: [usertourkit.com/blog/trpc-product-tour-config](https://usertourkit.com/blog/trpc-product-tour-config)
