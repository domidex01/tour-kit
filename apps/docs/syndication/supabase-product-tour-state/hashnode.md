---
title: "Tour Kit + Supabase: tracking tour state per user"
slug: "supabase-product-tour-state"
canonical: https://usertourkit.com/blog/supabase-product-tour-state
tags: react, supabase, typescript, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/supabase-product-tour-state)*

# Tour Kit + Supabase: tracking tour state per user

Your onboarding tour works. Users step through it, reach the end, and the tour doesn't reappear because you stored a `completed: true` flag in localStorage. Then one of three things happens: the user clears their browser data, switches to their work laptop, or opens your app on their phone. The flag is gone. The tour replays from step 1.

localStorage isn't persistence. It's a suggestion.

Supabase gives you a PostgreSQL database with built-in auth and Row Level Security (RLS) on a free tier that covers 50,000 monthly active users. Replacing that localStorage call with a Supabase upsert means tour state follows the user across every device, every browser, every cleared cache.

This tutorial builds a custom storage adapter that syncs Tour Kit's tour progress to a Supabase table. About 90 lines of TypeScript total.

Read the full tutorial with all code examples, RLS performance benchmarks, and the JSONB vs normalized schema tradeoff discussion at the original article: [Tour Kit + Supabase: tracking tour state per user](https://usertourkit.com/blog/supabase-product-tour-state)
