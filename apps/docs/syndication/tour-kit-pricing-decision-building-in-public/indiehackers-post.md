## Indie Hackers Post

**Title:** I need 54 sales/month to sustain my open source React library — here's the full pricing breakdown

**Body:**

I built Tour Kit, a headless product tour library for React. 10 packages. The core is MIT (free forever). The extended packages are $99 one-time.

I just published a full building-in-public breakdown of how I arrived at the pricing, including the parts that went wrong. Here are the highlights:

**Why one-time, not subscription:** Tour Kit is npm packages, not a hosted service. Charging monthly for code already in your node_modules felt dishonest. SlashData data shows 44% of developers prefer one-time for package-based tools.

**Why $99 specifically:** Under $50 is impulse territory (low commitment = high support burden). Over $100 triggers manager approval. $50-$99 is the "I'll expense this" zone where react-admin (~1M EUR/year) and Tailwind UI live.

**The MIT/Pro boundary:** Individual developer needs (tours, hints, a11y) = free. Organizational needs (NPS surveys, checklists, adoption tracking) = paid. Nobody argued with this split. The n8n controversy showed what happens when you get the boundary wrong after building community trust.

**The mistake that cost 2 weeks:** Built custom Stripe integration before discovering Polar.sh handles license delivery for dev tools at 4% + $0.40/tx. Deleted 800 lines of code.

**The napkin math:** $99 minus Polar fees = $95.64 net. $85/month costs + $5,000/month target = 54 licenses/month.

That's the whole thing. Not venture-scale math. Just sustainability.

Full article: https://usertourkit.com/blog/tour-kit-pricing-decision-building-in-public

Would love feedback on the pricing decisions, especially from anyone who's gone through a similar open-core pricing exercise.
