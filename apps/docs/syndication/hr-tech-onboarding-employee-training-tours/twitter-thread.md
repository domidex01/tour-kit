## Thread (6 tweets)

**1/** HR portals ask employees to do complex tasks (I-9 verification, benefits enrollment) once a year. Nobody reads the PDF manual. 58% prefer self-paced learning.

Here's what we learned building accessible training tours for HR SaaS:

**2/** The core tension: "If your users require training to use the portal, you haven't delivered a good self-service experience."

But I-9 has a 3-day legal deadline. Benefits enrollment closes after 30 days. You can't just simplify away the complexity. You guide through it.

**3/** HR portals have a unique constraint: ADA legally requires accessible employee-facing tools.

Your tour tooltips need:
- Keyboard navigation (Tab/Enter/Escape)
- Focus trapping
- aria-live regions
- 4.5:1 contrast

Enterprise procurement won't even evaluate you without a VPAT.

**4/** The other challenge: three audiences, one portal.

Employees check pay stubs. Managers approve time-off. Admins configure benefits plans.

A linear 8-step tour breaks immediately. Role-based step branching isn't a nice-to-have — it's the minimum viable implementation.

**5/** And here's what surprised us: HR compliance teams need tour completion logged to audit trails, not Google Analytics.

EEOC and I-9 audits require structured event records. Third-party tour SaaS (Pendo, Appcues) sends that data to external servers — GDPR problem.

**6/** Full guide with TypeScript code examples, WCAG compliance table, and library comparison (bundle sizes, accessibility support, analytics):

https://usertourkit.com/blog/hr-tech-onboarding-employee-training-tours
