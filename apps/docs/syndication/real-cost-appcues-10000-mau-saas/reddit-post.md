## Subreddit: r/SaaS (primary), r/startups (secondary)

**Title:** I broke down every line item of an Appcues contract at 10K MAU — here's the real cost

**Body:**

I've been researching onboarding tool pricing for a project I'm working on, and I was surprised by how far the actual cost of Appcues drifts from their pricing page at 10,000 MAU.

The published entry price is $249/month, but that's for 2,500 MAU on the Essentials plan — which locks out A/B testing, checklists, and Salesforce integration. At 10K MAU on the Growth plan (the first tier where you can actually do meaningful optimization), you're looking at $18,000–$24,000/year at list price.

Then the add-ons pile up:

- Unlimited Seats (Growth caps at 10): $2,400/year
- Premium Support (15% of contract): $2,700–$3,600/year
- Annual price escalators: 3–7% per renewal
- Analytics gap: most teams end up running Mixpanel or Amplitude alongside Appcues because the built-in analytics can't do funnel analysis

One thing I didn't expect: the pricing scales non-linearly. Going from 2,500 to 5,000 MAU on Growth is a 31% price increase, not 2x. That curve steepens as you grow.

Vendr's marketplace data (127 real contracts) shows a median deal of $15,000/year with an average 21% negotiated discount off list. So if you're paying sticker price, negotiate at quarter-end.

I also did the math on the open-source library approach (integration + maintenance at $150/hr senior dev rate). Over 3 years: ~$33,000 for the library route vs $57,000–$76,000 for Appcues Growth. The gap widens in Year 2+ because SaaS renews at escalating rates while maintenance costs drop.

Full breakdown with data tables and sources: https://usertourkit.com/blog/real-cost-appcues-10000-mau-saas

Disclosure: I built Tour Kit, an open-source alternative. But every number in the article comes from Appcues' pricing page, Vendr contract data, and G2/Capterra reviews — all verifiable.
