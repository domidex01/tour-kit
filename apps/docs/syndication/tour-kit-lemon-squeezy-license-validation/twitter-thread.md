## Thread (6 tweets)

**1/** I needed license validation for my React library's Pro tier. Tried Stripe first — realized I'd need to build an entire licensing server. Lemon Squeezy does it in 3 API endpoints. Setup: 3 hours instead of 3 days. 🧵

**2/** The integration: Next.js API route → Lemon Squeezy License API → React hook with 72-hour localStorage cache. Pro features show a watermark on invalid keys but keep working. Soft gating > hard blocking.

**3/** Gotcha #1: Lemon Squeezy's License API is PUBLIC. It doesn't use your store API key — the license key itself is the credential. You still want a server proxy, but no Authorization header needed.

**4/** Gotcha #2: Activation limits are LIFETIME, not concurrent. 5 activations = 5 ever, even if you deactivate some. Set limits to 10+ for dev tools. This is different from Keygen.sh where deactivation frees slots.

**5/** Gotcha #3: Webhook signature header is `x-signature`. Not `stripe-signature`. Not `x-hub-signature`. Cost me 20 minutes copying a Stripe handler 🤦

**6/** Full working code (API routes, React hook, webhook handler, provider component) + comparison table of LS vs Stripe vs Keygen:

https://usertourkit.com/blog/tour-kit-lemon-squeezy-license-validation
