## Subreddit: r/reactjs

**Title:** I replaced localStorage with Supabase for product tour state — here's the 90-line adapter

**Body:**

I've been building a headless product tour library (Tour Kit) and kept running into the same problem: users would complete an onboarding tour, then switch devices or clear their browser and get the tour all over again. localStorage works fine for single-device prototypes but falls apart in production.

I wrote up how to swap localStorage for a Supabase PostgreSQL table with Row Level Security. The interesting bits:

- One JSONB column stores all tour state per user, so you only need one read on login
- Wrapping `auth.uid()` in `(select ...)` in RLS policies improves evaluation from 179ms to 9ms (per Supabase's own benchmarks) — PostgreSQL evaluates the subselect once per query instead of once per row
- The `null` comparison gotcha: when `auth.uid()` returns null for unauthenticated requests, `null = user_id` evaluates to null, not false. The `TO authenticated` clause on each policy catches this, but it's easy to miss
- The whole adapter is about 60 lines — an in-memory cache handles reads, writes go async to Supabase

One tradeoff worth mentioning: JSONB is great for per-user tour state, but if you need to run analytics queries across all users (e.g., "what % completed the welcome tour?"), you'd want a normalized schema instead.

Full write-up with the SQL migration, TypeScript adapter code, and free tier gotchas: https://usertourkit.com/blog/supabase-product-tour-state

Curious if anyone else has gone down this path or found a better pattern for persisting onboarding state cross-device.
