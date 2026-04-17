# The GDPR Problem With Product Tour Tools (And 7 Options That Handle It)

## Most onboarding tools solve GDPR with a PDF. One solves it with architecture.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-product-tour-tools-gdpr-compliance)*

GDPR fines passed €7.1 billion as of mid-2025. European regulators process 443 breach notifications per day. Sweden's DPA has started targeting manipulative cookie banners specifically.

Product tour tools sit right in the crosshairs. They inject JavaScript, track behavior, store user profiles, and drop cookies. Under GDPR, that means you need explicit consent for tracking, a signed Data Processing Agreement with the vendor, and deletion within 30 days.

We checked seven product tour tools on what actually matters for GDPR: DPA availability, EU hosting, cookie behavior, deletion workflows, and whether the tool's architecture supports GDPR Article 25's "Privacy by Design" requirement.

*Disclosure: We built Tour Kit, tool #1 on this list. Every data point links to a primary source you can verify.*

---

**The quick version:**

- Tour Kit (headless library): No data leaves your infrastructure. No DPA needed. Free.
- Appcues: Public DPA, EU hosting, GDPR Deletion API. $300/month.
- Pendo: EU instance, 21-day deletion. Custom pricing.
- Userflow: Public DPA PDF, SCCs included. $240/month.
- Chameleon: 72-hour breach notification, global GDPR rights. Custom pricing.
- Userpilot: EU-US DPF certified, but DPA requires sales contact. $249/month.
- Usetiful: Czech company, EU residency by default. Free tier available.

---

## The angle every comparison misses

GDPR compliance isn't just about having a DPA and EU hosting. It's about what happens when users click "reject."

A Smashing Magazine case study documented that tracked traffic collapsed roughly 95% when switching to proper opt-in consent defaults. For SaaS product tour tools, this creates a cascading failure: no consent means no behavioral segmentation, no A/B testing data, no engagement scoring. The features these platforms sell as differentiators stop working the moment GDPR consent is properly implemented.

Headless tools sidestep this entirely. Tour Kit runs locally, targeting users by application state (current page, activated features) instead of behavioral profiles that require consent.

EU guidance from May 2020 was blunt: "Cookie walls do not offer users a genuine choice" and "scrolling or swiping does not constitute consent."

## How to choose

**Choose a headless library (Tour Kit)** if your DPO wants zero third-party data processing. No DPA negotiations, no vendor audits. Tradeoff: you need React developers.

**Choose a SaaS platform with EU hosting (Appcues, Usetiful)** if product managers own onboarding and your DPO accepts vendor data processing under a DPA.

**Choose a combined analytics platform (Pendo, Userpilot)** if you want fewer data processors in your GDPR inventory.

France's data protection authority (CNIL) recommends building privacy into the technical architecture from the start. For product tours, that means choosing a tool where compliance is structural, not contractual.

---

Full comparison with code examples and detailed GDPR analysis: [usertourkit.com/blog/best-product-tour-tools-gdpr-compliance](https://usertourkit.com/blog/best-product-tour-tools-gdpr-compliance)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, The Startup*
