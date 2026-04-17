Most product tours store progress in localStorage.

That works until your user switches to their phone, clears their browser, or opens an incognito tab. The tour replays from scratch.

I wrote up how to replace localStorage with a Supabase PostgreSQL table for cross-device tour state persistence. The whole adapter is about 90 lines of TypeScript.

Two things I learned building this:

1. Wrapping auth.uid() in a subselect in RLS policies improves evaluation from 179ms to 9ms — a detail buried in Supabase's own performance docs that most tutorials skip.

2. When auth.uid() returns null for unauthenticated users, the comparison null = user_id evaluates to null, not false. Without the right policy clause, this silently bypasses security.

Full tutorial with the SQL migration, TypeScript adapter, and JSONB vs normalized schema tradeoffs: https://usertourkit.com/blog/supabase-product-tour-state

#react #supabase #typescript #webdevelopment #opensource #productdevelopment
