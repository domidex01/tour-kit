## Subreddit: r/reactjs

**Title:** I compared the real cost of 14 product tour tools — the price range is wild

**Body:**

I've been building a product tour library (Tour Kit) and got curious about what the actual market looks like price-wise. So I pulled pricing from every tool I could find with public or semi-public pricing. Here's what I found.

The range is enormous. At the bottom you have open-source libraries (Shepherd.js, Driver.js, React Joyride) at $0 upfront. In the middle, SaaS tools like UserGuiding ($2,088/year), Userpilot ($2,988/year), and Appcues ($2,988/year). At the top, enterprise tools like Pendo ($15,900+/year) and Whatfix (~$32,000/year).

The thing that surprised me most was the free tier trap. Pendo's free plan caps at 500 MAU — cross 501 users and the next tier is $15,900/year. Chameleon gives you 1,000 MAU free, then it's $279/month. UserGuiding's free tier doesn't even include product tours.

Product Fruits is the outlier with a genuinely useful free tier: 5,000 MAU with unlimited tours.

The other pattern I noticed: every SaaS tool uses MAU-based pricing, so your costs scale with your success. A 2,000-MAU product paying $249/month at Userpilot will pay $499/month at 10,000 MAU.

Full disclosure: I built Tour Kit, which is $99 one-time (MIT core is free). So I'm biased. But the pricing data for everyone else comes from their public pages and third-party reviews. I linked all sources in the full article.

Full comparison table with 14 tools and 3-year TCO: https://usertourkit.com/blog/cheapest-product-tour-tool-2026

Curious what others are paying for onboarding tooling — is anyone using the cheaper SaaS options like Usetiful or Produktly?
