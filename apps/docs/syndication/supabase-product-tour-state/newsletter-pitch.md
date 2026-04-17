## Subject: Persisting product tour state in Supabase (React + TypeScript tutorial)

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a tutorial on replacing localStorage with Supabase for product tour state in React apps. It covers the SQL migration with RLS policies, a 90-line TypeScript storage adapter with in-memory caching, and a gotcha around null auth UID comparisons that silently bypasses security policies.

The performance angle might interest your readers: wrapping `auth.uid()` in a subselect improves RLS policy evaluation from 179ms to 9ms per Supabase's own benchmarks.

Link: https://usertourkit.com/blog/supabase-product-tour-state

Thanks,
Domi
