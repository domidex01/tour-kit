## Thread (6 tweets)

**1/** localStorage for product tour state is a trap.

User clears cache → tour replays. User switches device → tour replays. User opens incognito → tour replays.

Here's how to fix it with Supabase in ~90 lines of TypeScript:

**2/** The setup: one PostgreSQL table with a JSONB column.

One row per user, all tour state in one blob. One read on login loads everything.

RLS policies scope each user to their own row automatically — no middleware needed.

**3/** The gotcha nobody warns you about:

`auth.uid()` returns `null` for unauthenticated requests.

`null = user_id` evaluates to `null`, not `false`.

Without `TO authenticated` on each policy, this silently passes.

**4/** Performance tip from Supabase's own docs:

Wrapping `auth.uid()` in `(select auth.uid())` improves RLS policy evaluation from 179ms → 9ms.

PostgreSQL evaluates the subselect once per query, not once per row. 95% faster.

**5/** The adapter uses an in-memory cache — reads are instant after the first load.

Writes go async to Supabase. Users don't wait for the round-trip.

About 60 lines for the adapter + 10 lines to wire it into Tour Kit's TourKitProvider.

**6/** Full tutorial with SQL migration, TypeScript code, free tier gotchas, and JSONB vs normalized schema tradeoffs:

https://usertourkit.com/blog/supabase-product-tour-state

Built with Tour Kit — headless product tours for React.
