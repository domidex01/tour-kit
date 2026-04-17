## Subreddit: r/reactjs (primary), r/webdev (secondary), r/SaaS (tertiary)

**Title:** I dug into who actually owns your data when you use Pendo, Appcues, and WalkMe for onboarding tours

**Body:**

I spent a week reading through the privacy policies, data processing agreements, and export documentation of the major SaaS onboarding tools (Pendo, Appcues, WalkMe). The gap between "you own your data" in marketing copy and what the terms actually say is... something.

A few things that surprised me:

- WalkMe retains personal data for up to 7 years for backup/litigation and takes 90 days to process deletion requests. GDPR subject access requests have a 30-day window. The math doesn't work.
- Under GDPR, you're the data controller and the vendor is the data processor. You bear accountability for data practices even though the data sits on their infrastructure.
- The EU Data Act (enforced Sept 2025) now requires machine-readable exports at no cost, but as of April 2026, no major onboarding vendor has publicly documented how they comply.
- SOC 2 Type II certification costs $50K-$100K initial + $20K-$50K annually. That's a real argument for letting vendors handle compliance.

The alternative is code-owned onboarding (open-source library + your own analytics pipeline). You eliminate the processor relationship entirely, but you also take on the infrastructure burden. Not always the right trade-off for small teams.

I wrote up the full analysis with a vendor comparison table and a 5-point data sovereignty checklist: https://usertourkit.com/blog/data-ownership-onboarding-tour-analytics

Disclosure: I built Tour Kit (open-source product tour library), so I have a clear bias toward code-owned solutions. Tried to be fair to the SaaS side too.

Curious what others have found when trying to export data from onboarding tools. Has anyone actually tested Appcues or Pendo's export in practice?
