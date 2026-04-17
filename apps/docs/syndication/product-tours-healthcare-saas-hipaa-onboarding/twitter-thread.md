## Thread (6 tweets)

**1/** Healthcare SaaS activation rate: 23.8%
Industry average: 37.5%

That's a 36% gap. The cause isn't bad UX — it's compliance friction.

Here's what HIPAA actually means for your product tour implementation:

**2/** HIPAA has 3 rules that affect tours at the code level:

- Security Rule: session timeouts, cache restrictions, audit logging
- Privacy Rule: no PHI in tour content, synthetic data only
- Breach Notification: third-party scripts on PHI pages = liability

Most tour tools violate at least one.

**3/** The BAA trap:

Any tour tool that injects scripts onto PHI pages is a Business Associate under HIPAA.

That means legal review + security questionnaire + BAA negotiation = 4-8 weeks before your first tooltip goes live.

Self-hosted libraries skip this entirely.

**4/** The constraint nobody talks about:

As of May 2026, healthcare orgs on Medicare/Medicaid must comply with WCAG 2.1 AA.

Your product tour must be HIPAA-compliant AND accessible. Both are now legally required simultaneously.

**5/** What actually works for healthcare onboarding:

- Role-scoped tour paths (physician ≠ nurse ≠ biller)
- Synthetic data in sandbox environments
- Session-persistent progress (timeouts will interrupt tours)
- Short, scannable steps (clinical staff are under cognitive load)

**6/** Full breakdown with HIPAA compliance tables, TypeScript code examples, and audit logging patterns:

https://usertourkit.com/blog/product-tours-healthcare-saas-hipaa-onboarding
