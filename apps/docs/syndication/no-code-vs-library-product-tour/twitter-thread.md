## Thread (6 tweets)

**1/** No-code onboarding tools don't publish their bundle sizes.

Not Appcues. Not Userpilot. Not Chameleon. Not Pendo.

You're injecting a third-party script and trusting it won't hurt your Core Web Vitals.

I dug into the no-code vs library question. Here's what I found:

**2/** The pricing math is wild.

Appcues: $300-750/month
Userpilot: $299/month
Chameleon: $299-1,250/month
Pendo: $15k-140k+/year

All scale with MAU. A React library is $0 (MIT) + developer time.

At 10,000 MAU, you're paying $750-1,500/month for tour tooltips.

**3/** Accessibility is the sleeper issue.

No-code tools inject DOM elements outside your React tree. You can't control ARIA attributes or focus management.

MDN data: pages with ARIA present have 41% more detected errors on average.

ARIA done wrong > no ARIA at all.

**4/** React 19 and Next.js App Router make no-code tools worse.

DOM injection collides with virtual DOM reconciliation. The script doesn't know about your component boundaries, suspense boundaries, or streaming HTML.

Libraries render inside your React tree. No injection, no conflicts.

**5/** But no-code tools aren't always wrong.

If your growth PM iterates on tours weekly, Appcues claims 25% higher activation rates.

The Motley Fool hit 9% churn reduction in 45 days with Chameleon + Segment.

At Series B+, the ROI math can work.

**6/** I built a decision framework mapped to team size:

- Solo/seed: library (save $3,600-9,000/yr)
- Series A: depends on who edits tours
- Series B+: probably both

Full breakdown with comparison table and code examples:
https://usertourkit.com/blog/no-code-vs-library-product-tour
