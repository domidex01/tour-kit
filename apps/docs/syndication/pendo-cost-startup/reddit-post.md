## Subreddit: r/startups (primary) or r/SaaS

**Title:** I broke down Pendo's real cost for a Series A startup — the 3-year TCO is $85K, not $7K

**Body:**

I've been researching onboarding tool pricing for my own startup and was surprised by how misleading the "Pendo for Startups" program looks on paper.

The program costs $7K/year, but it's only available pre-Series B. Once you graduate, you migrate to standard pricing: Base tier starts at $15.9K and customer reports show quotes jumping to $35K. The median Pendo customer pays $48K/year according to Vendr marketplace data.

I modeled a 3-year TCO for a startup at 3,000 MAU growing 15% QoQ:

- Year 1 (startup program): $10K (license + integration)
- Year 2 (graduated to Base, ~8K MAU): $30K
- Year 3 (~14K MAU, pushed to Core): $45K
- **Total: $85K**

For comparison, an open-source tour library + your existing analytics stack (PostHog/Mixpanel/Amplitude) runs about $4,500 over the same period. The $80K gap is real.

The other thing that surprised me: most startups already pay for product analytics separately. Pendo bundles analytics into every tier, so you're paying for duplicate capability.

Where Pendo does make sense: enterprise scale (50K+ MAU), teams with no frontend engineering capacity, and orgs that genuinely need to consolidate 3+ tools into one vendor.

Full breakdown with tier-by-tier pricing tables and hidden cost analysis: https://usertourkit.com/blog/pendo-cost-startup

Disclosure: I'm building Tour Kit, an open-source React tour library. The data is from public sources (Vendr, Featurebase, UserGuiding), but I obviously have an angle here.
