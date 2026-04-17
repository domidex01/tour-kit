## Subreddit: r/reactjs

**Title:** I wired Lemon Squeezy license validation to a React library — here are the 3 gotchas I hit

**Body:**

I'm building an open-source React library with a Pro tier. Needed a way to validate license keys without building a custom licensing server. Went with Lemon Squeezy because it generates keys automatically on purchase and has a validation API.

Three things I wish I'd known before starting:

1. **The License API is public.** It doesn't use your store's API key — the license key itself is the credential. So you still want a server-side proxy to keep keys out of client-side network requests, but you don't need an Authorization header.

2. **Activation limits are lifetime, not concurrent.** If a key allows 5 activations and someone uses 5 different browsers during dev, the key is permanently exhausted. Deactivating doesn't free the slot. I set mine to 10+ after learning this the hard way.

3. **Webhook signature header is `x-signature`.** Not `x-hub-signature`, not `stripe-signature`. Spent 20 minutes debugging signature verification because I copied a Stripe webhook handler. The signature is HMAC-SHA256 of the raw body.

The integration runs through a Next.js API route → Lemon Squeezy License API → React hook with 72-hour localStorage cache. Pro features show a watermark on invalid keys but keep working (soft gating).

Lemon Squeezy charges 5% + $0.50/txn and handles MoR + tax. By comparison, Stripe is 2.9% + $0.30 but has zero licensing features built in.

Full writeup with working code (API routes, React hook, webhook handler): https://usertourkit.com/blog/tour-kit-lemon-squeezy-license-validation

Happy to answer questions about the Lemon Squeezy API or the caching approach.
