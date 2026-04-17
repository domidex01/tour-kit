## Subreddit: r/healthIT (primary), r/reactjs (secondary)

### r/healthIT post

**Title:** HIPAA compliance constraints that affect product tour implementations — what I learned building onboarding for healthcare SaaS

**Body:**

I spent time researching how HIPAA's three rules (Privacy, Security, Breach Notification) specifically affect frontend product tour implementations. Most compliance guides are written for compliance officers, not developers. Here's what I found matters at the code level.

The biggest surprise: healthcare SaaS activation rates are 23.8% versus 37.5% cross-industry average (Userpilot benchmark, n=547 companies). But healthcare workers who do engage with onboarding checklists complete them at 20.5% — the highest of any vertical. The bottleneck is getting them started, not keeping them going.

Key technical constraints that tripped me up:

- **Session timeouts:** Tour step transitions must not count as user "activity" or you'll accidentally extend sessions past your HIPAA timeout policy
- **BAA requirements:** Any third-party tour tool that injects scripts onto PHI-accessible pages is a Business Associate. That means BAA negotiation before your onboarding goes live
- **Role-based step filtering:** A tour that navigates a billing clerk to physician-only screens violates the Minimum Necessary principle
- **Cache-Control headers:** Tour overlays need to work with `no-store` headers since PHI images can't be browser-cached
- **Audit logging passthrough:** Tour-triggered PHI views need to flow through your existing audit pipeline

The WCAG 2.1 AA mandate for Medicare/Medicaid organizations (effective May 2026) adds another layer — your product tour itself must be fully accessible.

I wrote up the full breakdown with compliance tables and TypeScript code examples: https://usertourkit.com/blog/product-tours-healthcare-saas-hipaa-onboarding

Curious if others building healthcare SaaS have run into similar onboarding friction. What patterns have worked for your team?

---

### r/reactjs post

**Title:** Building HIPAA-compliant product tours in React — the compliance constraints I didn't expect

**Body:**

I've been working on product tour implementations for healthcare SaaS and the HIPAA constraints create some interesting React architecture problems.

For example: HIPAA requires automatic session timeouts, but product tours need to persist progress across sessions. Your tour component can't extend the inactivity timer when a user clicks "Next step." And if a third-party tour tool injects scripts onto pages where PHI is visible, that vendor needs a Business Associate Agreement — which can add 4-8 weeks of procurement.

The approach that worked: self-hosted React components with role-based step arrays, synthetic data in sandbox environments, and audit event passthrough for any PHI-adjacent navigation.

Wrote up the full technical breakdown with code examples: https://usertourkit.com/blog/product-tours-healthcare-saas-hipaa-onboarding

Anyone else building in regulated verticals? Curious what patterns you've found useful.
