## Subreddit: r/reactjs (primary), r/webdev (secondary), r/gdpr (tertiary)

**Title:** I read the actual DPAs of 7 product tour tools to compare their GDPR compliance. Here's what I found.

**Body:**

I spent a week reading DPA documents, checking EU hosting options, and testing cookie behavior for the most common product tour tools. Most "GDPR compliant" claims boil down to a checkbox on a features page. The reality is more nuanced.

**The main finding:** There's a structural gap between SaaS tour tools (Appcues, Pendo, Userpilot, etc.) and headless libraries. SaaS tools solve GDPR with legal agreements — DPAs, SCCs, EU hosting options. Headless tools solve it architecturally — no data leaves your infrastructure, so there's no data processor relationship to manage.

**The consent problem nobody discusses:** A Smashing Magazine case study found tracked traffic collapsed ~95% with proper opt-in consent. For SaaS tour tools, this means their core value proposition (behavioral segmentation, A/B testing, engagement scoring) breaks when GDPR consent is properly implemented. If a user declines analytics cookies, the tour tool can't personalize anything.

**Quick breakdown by GDPR posture:**

- Appcues: Public DPA, EU hosting available, 30-day deletion API. $300/mo+
- Pendo: EU instance, 21-day deletion. Custom pricing.
- Userflow: Public DPA PDF with SCCs. $240/mo+. No EU-only hosting.
- Chameleon: 72-hour breach notification. But hosting location not public.
- Userpilot: EU-US DPF certified. But DPA requires contacting sales.
- Usetiful: Czech company, EU residency by default. Free tier. $29/mo.
- Tour Kit (ours): Headless React library, zero data egress, zero cookies. Free/MIT.

**The EAA angle:** The European Accessibility Act entered enforcement in 2025 with GDPR-mirror penalties. None of the SaaS platforms certify WCAG 2.1 AA. That's a second regulatory risk sitting right next to GDPR.

Full writeup with comparison table, code examples, and source links: https://usertourkit.com/blog/best-product-tour-tools-gdpr-compliance

Disclosure: I built Tour Kit. Tried to be fair — Appcues genuinely has the strongest SaaS GDPR posture. Happy to answer questions about the methodology.
