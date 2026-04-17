## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote a tutorial on replacing localStorage with Supabase for product tour state. Covers a JSONB-based schema with RLS policies, an in-memory cached storage adapter (~90 lines of TS), and a few gotchas around null auth UID comparisons. Might be useful if you're persisting any per-user UI state in Supabase: https://usertourkit.com/blog/supabase-product-tour-state

Curious if anyone has a preferred pattern for cross-device UI state persistence — would love to hear alternatives.
