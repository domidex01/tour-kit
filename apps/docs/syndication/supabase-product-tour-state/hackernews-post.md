## Title: Persisting product tour state in Supabase with RLS – a 90-line TypeScript adapter

## URL: https://usertourkit.com/blog/supabase-product-tour-state

## Comment to post immediately after:

I've been working on a headless product tour library for React and kept hitting the localStorage wall — users lose their onboarding progress when switching devices or clearing browser data.

This write-up walks through replacing localStorage with a Supabase PostgreSQL table. The interesting technical bits:

1. Wrapping `auth.uid()` in `(select ...)` in RLS policies improves evaluation from 179ms to 9ms per Supabase's own benchmarks. PostgreSQL evaluates the subselect once per query instead of once per row — most tutorials skip this optimization.

2. The `null` comparison gotcha: when `auth.uid()` returns null for unauthenticated requests, `null = user_id` evaluates to null, not false. Without the `TO authenticated` clause on each policy, this silently passes instead of blocking.

3. JSONB vs normalized tables is a real architectural decision. Single JSONB column is simpler (one read loads everything) but makes aggregate queries across users expensive. Worth discussing tradeoffs.

The whole adapter is about 90 lines of TypeScript with an in-memory cache for reads and async writes. Supabase's free tier (500 MB, 50K MAU) is more than enough for tour state since rows are under 1 KB each.

Happy to discuss the architecture choices or alternative approaches.
