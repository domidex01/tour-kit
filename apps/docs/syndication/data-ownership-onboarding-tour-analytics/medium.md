# Who Really Owns Your Onboarding Analytics?

## The gap between legal data ownership and operational control in SaaS tools

*Originally published at [usertourkit.com](https://usertourkit.com/blog/data-ownership-onboarding-tour-analytics)*

You shipped a 7-step onboarding tour last quarter. It runs through Pendo. Users complete it, skip steps, drop off at step 4. All of that behavior data sits on Pendo's servers. Accessed through Pendo's dashboard. Exported through Pendo's API at Pendo's rate limits.

You call it "your data." But can you actually take it with you?

As of April 2026, most SaaS onboarding tools operate as data custodians, not partners. They hold your tour analytics in proprietary formats, behind premium export tiers, subject to retention policies you didn't write.

## The ownership illusion

Most product teams assume they own their tour analytics because the data describes their users, but that assumption crumbles the moment you try to migrate.

Onur Alp Soner, CEO at Countly, put it plainly: "When you rely on third-party tools, you're essentially renting insight. The data might live on someone else's servers, and you access it via their interfaces."

Consider the export reality across major vendors: Pendo stores analytics with proprietary API export. Appcues offers CSV via async polling. WalkMe requires manual requests with 90-day processing windows. WalkMe retains personal data for up to 7 years for backup and litigation purposes. That's three months between "delete my users' data" and it actually happening.

## What GDPR actually requires

Under GDPR, the company deploying an onboarding tool is the data controller. The vendor is the data processor. This distinction carries real consequences.

Three requirements that most vendor comparison pages skip:

**A Data Processing Agreement is mandatory.** Every SaaS onboarding vendor must sign a DPA with you. If they haven't, you're in violation of GDPR Article 28.

**You must delete and export user data on demand.** Subject access requests have a 30-day window. If your vendor takes 90 days to process a deletion, you fail the compliance deadline.

**Data minimization isn't optional.** SaaS tools that collect IP addresses, geolocation, and behavioral metadata by default put the justification burden on you. WalkMe claims not to collect PII "by default" but still captures IP addresses in logs. Under GDPR, IP addresses can constitute personal data.

## The EU Data Act changes the calculus

Since September 2025, the EU Data Act requires SaaS vendors to provide data exports in structured, machine-readable formats at no additional cost. Penalties can reach 2% of annual global turnover. As of April 2026, no major onboarding vendor has publicly documented compliance.

Thirteen US states now have consumer privacy laws in effect or pending. GDPR fines totaled over EUR 4.5 billion between 2018 and 2025.

## The counterargument: vendor-hosted data isn't always wrong

Self-hosting analytics means self-maintaining analytics. SOC 2 Type II certification costs $50,000 to $100,000 for initial audit. Vendors amortize those costs across thousands of customers.

A 5-person startup with a single part-time ops engineer isn't better off running self-hosted analytics infrastructure. Visual builders, rapid prototyping, and enterprise compliance certifications are legitimate reasons to choose SaaS.

The question isn't "is SaaS onboarding always bad." It's whether your team has made a conscious choice about where tour analytics live.

## The data sovereignty checklist

Before your next vendor renewal:

1. Can you export all tour analytics in a standard format without contacting support?
2. Do you have a signed DPA?
3. What happens to your data if the vendor shuts down? Builder.ai's collapse in May 2025 left customers scrambling.
4. Can you satisfy a GDPR deletion request within 30 days using only vendor tools?
5. Is your tour analytics data in your disaster recovery plan?

The average data breach cost reached $4.45 million in 2023, up 15% over three years (IBM). And 92% of companies acknowledge inadequate data security discourages purchases (Cisco).

---

*Disclosure: I built Tour Kit, an open-source headless product tour library for React. Take this analysis with appropriate skepticism. Every claim is verifiable against public vendor documentation.*

*Full article with code examples and comparison table: [usertourkit.com/blog/data-ownership-onboarding-tour-analytics](https://usertourkit.com/blog/data-ownership-onboarding-tour-analytics)*

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, Towards Data Science (data governance angle)
