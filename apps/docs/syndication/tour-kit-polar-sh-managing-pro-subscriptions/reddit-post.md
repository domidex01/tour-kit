## Subreddit: r/reactjs

**Title:** How we handle Pro license keys in an open-source React library (Polar.sh + React hook)

**Body:**

I maintain Tour Kit, a headless product tour library for React with a free/pro tier split. The free packages (core, react, hints) are MIT. The pro packages (surveys, analytics, scheduling, etc.) need a license key.

The question was: how do you validate license keys in a React library that runs entirely in the browser? Most licensing APIs require server-side auth, which means your users need to set up an API route just to use your library.

Polar.sh has a customer portal validation endpoint that needs no authentication. You send the key and org ID, get back `granted`/`revoked`/`disabled`. Safe to call from client-side code. We built a React hook around it with 72-hour localStorage caching.

Three things we learned the hard way:

1. **Polar's API uses snake_case** for request bodies even though the TypeScript SDK uses camelCase. If you call the REST API directly, you'll get 422 errors until you figure this out.

2. **Activation limits are lifetime, not concurrent.** Deactivating a device does NOT free up a slot. Almost shipped a "deactivate" button that would have been useless.

3. **The 4% fee is domestic-only.** International cards add +1.5%, subscriptions add +0.5%. Effective rate for international customers is ~7.3%, not the advertised 4%.

Full writeup with all the TypeScript code (validation, activation, caching hook, and provider): https://usertourkit.com/blog/tour-kit-polar-sh-managing-pro-subscriptions

Happy to answer questions about the integration or the free/pro model for open-source libraries.
