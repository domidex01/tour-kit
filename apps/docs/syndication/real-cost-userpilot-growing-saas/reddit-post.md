## Subreddit: r/SaaS (primary), r/startups (secondary)

**Title:** We mapped Userpilot's real pricing from 1K to 10K MAU. The jump from 2,000 to 2,001 users costs $6,000/year.

**Body:**

We've been researching onboarding tool pricing for a while (we build an open-source alternative, so we're obviously interested in this space). Userpilot's pricing page shows $299/month for the Starter plan, but the actual cost trajectory for a growing SaaS is much steeper than the headline suggests.

The key finding: there's a hard pricing cliff at 2,001 MAU. Below 2,000, you're at $299/month. At 2,001, you jump to the Growth plan at $799/month. That's a $6K/year increase from a single additional user. And above the Growth base price, there's no public calculator at all. Vendr's transaction database shows actual annual spend ranging from $7,638 to $60,680. That's an 8x spread with no way to model it beforehand.

On top of the subscription: A/B testing, custom analytics, advanced segmentation, and content throttling all require the Growth plan. Session replays are an unpublished add-on. CRM sync is Enterprise-only. Data retention is only 1 year on Starter. And Userpilot is web-only, so cross-platform teams need a separate mobile tool.

We estimated 3-year TCO for a team growing from 1K to 5K MAU at $38,000+. The $299/month sticker price is a long way from the actual bill.

To be fair: Userpilot's no-code builder is genuinely good for non-technical teams, and the survey/NPS integration is solid. This isn't about Userpilot being bad. It's about the gap between advertised pricing and actual cost at scale.

Full breakdown with comparison tables: https://usertourkit.com/blog/real-cost-userpilot-growing-saas
