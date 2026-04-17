## Subreddit: r/reactjs

**Title:** We wrote a guide on building accessible, role-aware training tours for HR SaaS portals

**Body:**

I've been working on Tour Kit (headless product tour library for React) and recently put together a guide on one of the less-discussed use cases: building training tours for HR portals.

HR apps have some unique constraints that general SaaS doesn't deal with. I-9 completion has a 3-business-day legal deadline. Benefits enrollment windows close after 30 days. ADA and Section 508 legally require accessible employee-facing tools — so your tour tooltips need keyboard navigation, focus trapping, aria-live regions, and proper contrast ratios. Enterprise procurement teams often require a VPAT before they'll even evaluate your software.

The other interesting challenge is role-based branching. HR portals serve admins, managers, and employees from the same codebase. A linear tour breaks immediately because three people see three different dashboards. We implemented this with conditional step logic — shared steps for everyone, then role-specific paths.

One thing that surprised us: HR compliance teams need tour completion logged to audit trails, not Google Analytics. EEOC and I-9 audits require structured event records showing that employees completed required training flows.

The full guide covers WCAG compliance requirements for tour components, common HR onboarding patterns (first-day setup, benefits enrollment, manager workflows), TypeScript implementation examples, and a comparison of library options with bundle sizes and accessibility support.

Full article with code examples: https://usertourkit.com/blog/hr-tech-onboarding-employee-training-tours

Curious if anyone else has built tours for HR or other compliance-heavy verticals. What challenges did you hit?

---

## Subreddit: r/humanresources (adapted framing)

**Title:** Developer perspective: building self-service training tours for HR portals

**Body:**

I build developer tools for product tours, and recently wrote a guide specifically for HR software.

The core insight that drove the guide: "If your users require training to use the portal, you haven't delivered a good self-service experience." But HR portals handle genuinely complex tasks — I-9 verification, benefits enrollment, direct deposit setup. You can't just simplify them away.

Interactive walkthroughs cut time-to-value by 40% compared to PDF manuals or videos (Appcues data). More importantly for HR teams: they reduce how-to support tickets by about 30%.

The tricky parts for HR specifically:

- **Compliance deadlines**: I-9 has a 3-day legal requirement. Benefits enrollment windows close. Tours that track completion give HR teams audit trail data.
- **Three audiences, one portal**: Employees, managers, and admins need completely different training paths.
- **Accessibility is legally required**: ADA mandates accessible employee-facing tools. Your training system needs to meet WCAG 2.1 AA.
- **Data residency**: Third-party tour SaaS sends employee interaction data to external servers. GDPR may require keeping that in-house.

The guide has the technical implementation details for development teams: https://usertourkit.com/blog/hr-tech-onboarding-employee-training-tours

Would be interested to hear from HR teams — what's the biggest friction point when employees use your self-service portal?
