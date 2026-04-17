## Subreddit: r/reactjs

**Title:** I compiled activation benchmarks by B2B SaaS category and built a playbook for role-based product tours

**Body:**

I've been building product tours for B2B apps and kept running into the same problem: generic tours that show every feature to every user. The data says this consistently underperforms.

Here's what I found from the research:

- Segmented onboarding (by role) lifts activation 20-30% over generic tours
- Developer tools activate at 30-45%, CRM tools at 15-25% — the category gap is huge
- Four-step tours hit 60.1% completion. Over five steps drops below 20%
- Action-based tours (where users perform the task, not just click Next) produce 1.7x more signups
- WCAG 2.1 AA is now legally required for EU SaaS users under the European Accessibility Act

The approach I landed on: segment by role (admin/end-user/manager), keep tours to 3-5 steps each, and require the actual activation action before advancing. Each role has a different "aha moment" and trying to serve all three with one flow is where most B2B onboarding breaks down.

I wrote up the full playbook with TypeScript code examples, benchmark tables by SaaS category, bundle size comparisons, and accessibility implementation details: https://usertourkit.com/blog/b2b-saas-product-tour

Curious what patterns others have found work for multi-role B2B onboarding. The admin experience in particular seems like an afterthought in most products I've used.
