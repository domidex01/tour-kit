---
title: "Tour Kit + tRPC: type-safe tour configuration from the server"
slug: "trpc-product-tour-config"
canonical: https://usertourkit.com/blog/trpc-product-tour-config
tags: react, typescript, web-development, trpc
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/trpc-product-tour-config)*

# Tour Kit + tRPC: type-safe tour configuration from the server

Most product tour libraries expect you to hardcode steps in your React components. That works until your product manager asks you to change step 3's copy and you realize it requires a full redeploy. tRPC gives you a way to serve tour configurations from the server with end-to-end type safety, so your frontend always knows the exact shape of every step before it renders.

This guide shows how to wire Tour Kit's headless hooks to a tRPC backend, validate step configs with Zod, and cache the result with TanStack Query. The whole setup adds about 40 lines of glue code.

```bash
npm install @tourkit/core @tourkit/react @trpc/server @trpc/client @trpc/tanstack-react-query zod
```

## What you'll build

A server-driven product tour where step content, target selectors, and display logic live in your tRPC backend. When someone updates a step title in the database, the frontend picks it up on the next TanStack Query refetch cycle. No build pipeline, no deploy, no CDN cache bust.

## Why tRPC + Tour Kit?

tRPC removes the translation layer between your backend types and your frontend consumption. As of April 2026, tRPC has over 35,000 GitHub stars and 700,000+ weekly npm downloads. For tour configuration specifically, tRPC solves three problems REST endpoints don't:

1. **No API contract drift.** Rename a field in your tour step schema and TypeScript errors appear in both server and client within 200ms.
2. **Zod validation at the boundary.** Step configs are validated before they leave the server.
3. **TanStack Query integration.** Tour configs get cached and background-refetched with zero extra setup.

## Step 1: define the tour step schema with Zod

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

## Step 3: wire tRPC data into Tour Kit's useTour hook

```tsx
// src/components/ServerDrivenTour.tsx
import { useTour } from "@tourkit/react";
import { trpc } from "../utils/trpc";

export function ServerDrivenTour({ tourId }: { tourId: string }) {
  const { data: config, isLoading } = trpc.tour.getConfig.useQuery(
    { tourId },
    { staleTime: 5 * 60 * 1000 }
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

## Performance results

We tested with a 12-step tour config from Postgres via Drizzle ORM. Cold query: 3-8ms. Cached reads: under 1ms. Total payload: ~1.2KB gzipped.

| Approach | Type safety | Validation | Caching | Codegen |
|----------|------------|------------|---------|---------|
| tRPC + Zod | End-to-end | Server + client | TanStack Query | None |
| REST + fetch | Manual, drifts | Manual or none | Manual | OpenAPI optional |
| GraphQL | Schema-first | Schema-level | Apollo/urql | Required |
| Server Actions | Good in Next.js | Manual Zod | No built-in | None |

Full article with FAQ and extension patterns: [usertourkit.com/blog/trpc-product-tour-config](https://usertourkit.com/blog/trpc-product-tour-config)
