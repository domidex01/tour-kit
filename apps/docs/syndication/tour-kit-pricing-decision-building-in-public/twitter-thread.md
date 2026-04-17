## Thread (7 tweets)

**1/** I need 54 sales a month to sustain my open source React library. Here's how I got to that number, and why I chose $99 one-time instead of monthly subscriptions.

**2/** Every pricing article says "charge monthly, MRR is king." But Tour Kit is npm packages — not a hosted service. Charging monthly for code already in your node_modules felt dishonest.

39% of developers prefer one-time purchases for tooling (SlashData). The number hits 44% for packages.

**3/** Why $99 specifically?

- Under $50: impulse buy, low commitment, high support burden
- Over $100: needs manager approval at most companies
- $50–$99: "I'll expense this" zone

react-admin does ~1M EUR/year in this range. Tailwind UI lives here too.

**4/** The MIT/Pro boundary was the hardest call. I drew it at "who benefits":

Free: core tours, hints, navigation, a11y (individual dev needs)
Paid: surveys, checklists, scheduling, adoption (organizational needs)

Nobody argued with it. Not one GitHub issue.

**5/** I wasted 2 weeks building custom Stripe integration — webhooks, license keys, validation API, database tables. Then found Polar.sh.

Deleted 800 lines of code. Polar handles license delivery at 4% + $0.40/tx. The entire monetization backend is someone else's problem now.

**6/** The napkin math nobody publishes:

$99 - Polar fee = $95.64 net
Monthly costs: ~$85
Target salary: $5,000/mo
$5,085 / $95.64 = 54 licenses/month

That's sustainability. Not venture scale. Not $10M ARR. Just 54 developers who need the Pro packages.

**7/** Full breakdown with the anchoring psychology, what went wrong, and the n8n cautionary tale:

https://usertourkit.com/blog/tour-kit-pricing-decision-building-in-public

The core library is free forever (MIT). The pricing is for the extended packages. Roast my math.
