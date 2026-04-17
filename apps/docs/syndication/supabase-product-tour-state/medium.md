# Tour Kit + Supabase: tracking tour state per user

## Replace localStorage with cross-device persistence in 90 lines of TypeScript

*Originally published at [usertourkit.com](https://usertourkit.com/blog/supabase-product-tour-state)*

Your onboarding tour works. Users step through it, reach the end, and the tour doesn't reappear because you stored a completed flag in localStorage. Then one of three things happens: the user clears their browser data, switches to their work laptop, or opens your app on their phone. The flag is gone. The tour replays from step 1.

localStorage isn't persistence. It's a suggestion.

Supabase gives you a PostgreSQL database with built-in auth and Row Level Security (RLS) on a free tier that covers 50,000 monthly active users. Replacing that localStorage call with a Supabase upsert means tour state follows the user across every device, every browser, every cleared cache.

## Why Supabase for tour state?

Supabase is the most common open-source Firebase alternative for React projects in 2026. It auto-generates TypeScript types from your database schema, supports React 19 and Server Components, and starts free with a predictable upgrade path to $25/month.

Three things matter for tour state:

**Row Level Security** means you write one SQL policy and every query is automatically scoped to the authenticated user. No server-side middleware needed.

**JSONB columns** store arbitrary tour state without schema migrations. Add a new tour next month? No ALTER TABLE required.

**Same client everywhere** — the @supabase/supabase-js client works identically in browser and server environments.

## The key insight: wrapping auth.uid() matters

According to Supabase's RLS performance guide, wrapping auth.uid() in a subselect improves policy evaluation from 179ms to 9ms — a 95% improvement. PostgreSQL evaluates the subselect once per query instead of once per row.

The other gotcha: when auth.uid() returns null (unauthenticated requests), the comparison null = user_id evaluates to null, not false. Adding TO authenticated on each policy prevents data leaks.

## The full tutorial

The complete implementation covers:

- SQL migration with RLS policies and performance index
- A storage adapter with in-memory caching (about 60 lines)
- Wiring into Tour Kit's TourKitProvider (about 10 lines)
- Verification steps and troubleshooting
- JSONB vs normalized schema tradeoffs for analytics
- Free tier limitations and production considerations

Read the full tutorial with all code examples: [Tour Kit + Supabase: tracking tour state per user](https://usertourkit.com/blog/supabase-product-tour-state)

---

*Tour Kit is an open-source headless product tour library for React. We built the storage adapter interface specifically to support backends like Supabase without locking you into localStorage.*

**Suggested publications:** JavaScript in Plain English, Better Programming, Bits and Pieces
