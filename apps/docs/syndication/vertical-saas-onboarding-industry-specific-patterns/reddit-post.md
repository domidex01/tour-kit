## Subreddit: r/SaaS (primary), r/reactjs (secondary)

**Title:** I mapped out onboarding patterns for healthcare, fintech, and edtech SaaS — the compliance gotchas are wild

**Body:**

I've been digging into how vertical SaaS companies handle onboarding and the patterns diverge way more than I expected from horizontal products.

Some things I found:

**Healthcare (HIPAA):** Every tool in your onboarding stack needs a Business Associate Agreement. Third-party onboarding scripts that inject into your DOM become data processors under HIPAA. 68% of healthcare orgs run disconnected software, so onboarding often starts with connecting external systems (EHR, lab integrations) before the core product is usable. Consent collection and MFA have to be gated steps, not optional tooltips.

**Fintech (PCI DSS/KYC):** Shine hit 80% onboarding conversion through gamification while the industry benchmark sits at 21%. The big trap: product tours that render inside PCI-scoped iframes accidentally expand your PCI assessment scope. Tooltips need to anchor outside the iframe boundary.

**EdTech (FERPA):** A teacher creating a course and a student enrolling in one are using entirely different products that share a URL. Role-based branching isn't a nice-to-have, it's mandatory. WCAG became mandatory for EU SaaS in June 2025 and edtech spans a huge range of technical literacy.

The common thread: SaaS companies lose 75% of new users in week 1 without effective onboarding, but in vertical markets where switching costs are high and sales cycles are long, that loss compounds. Users who complete onboarding are 80% more likely to stick around long-term.

Full writeup with code examples for each vertical: https://usertourkit.com/blog/vertical-saas-onboarding-industry-specific-patterns

Happy to discuss any of these patterns if you're building in one of these verticals.
