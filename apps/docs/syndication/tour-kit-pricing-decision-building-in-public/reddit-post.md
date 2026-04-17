## Subreddit: r/SaaS (primary), r/indiehackers (secondary)

**Title:** I need 54 sales/month to sustain my open source React library. Here's the pricing breakdown.

**Body:**

I built Tour Kit, a headless product tour library for React. 10 packages. The core is MIT (free forever). The extended packages (surveys, scheduling, adoption tracking) are $99 one-time.

Every pricing resource says charge monthly. I almost did — built a three-tier SaaS grid and everything. But Tour Kit is npm packages, not a hosted service. Charging monthly for code already in your node_modules felt off.

The $99 number comes from anchoring analysis. Under $50 is impulse-buy territory where people don't invest enough to configure properly. Over $100 triggers manager approval at most companies. $50-$99 is the "I'll expense this" zone where react-admin (~1M EUR/year) and Tailwind UI live.

The hardest part was the free/paid boundary. I drew it at "who benefits": individual developer needs (tours, hints, a11y) are free, organizational needs (NPS surveys, checklists, adoption tracking) are paid. The n8n pricing controversy showed what happens when you get that line wrong after building a community. Tour Kit was designed as open-core from day one.

After Polar.sh fees (4% + $0.40/tx), I net $95.64 per sale. Monthly costs are ~$85. Target part-time salary is $5,000/month. That's 54 licenses/month to sustainability.

I wasted two weeks building custom Stripe integration before finding Polar. Deleted 800 lines of code. Lesson: don't build payment infrastructure when someone else already did.

Full writeup with all the data sources, developer quotes, and what I'd do differently: https://usertourkit.com/blog/tour-kit-pricing-decision-building-in-public

Happy to answer questions about the pricing decisions or the math.
