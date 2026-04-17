# When SaaS Onboarding Actually Makes Sense — An Honest Take From a Library Author

*Originally published at [usertourkit.com](https://usertourkit.com/blog/when-saas-onboarding-makes-sense)*

I build Tour Kit, an open-source React library for product tours. My entire business depends on developers choosing code over SaaS platforms. So when I tell you that SaaS onboarding tools are the right choice for a lot of teams, you can assume I mean it.

The build-vs-buy conversation has gotten stale. Library authors say "own your code." SaaS vendors say "don't reinvent the wheel." Both sides cherry-pick the scenarios that favor their product.

Here's my honest read on when SaaS wins, when it doesn't, and the specific signals that should drive your decision.

---

## Why this conversation keeps going in circles

The SaaS onboarding market hit $2.8B in 2026, growing at 19.6% CAGR. At the same time, Retool's 2026 Build vs. Buy Report found that 35% of enterprises have already replaced at least one SaaS tool with a custom build, and 78% plan to build more this year.

Both trends are true simultaneously. The market is growing *and* teams are leaving it.

That contradiction only makes sense when you realize the decision isn't about technology. It's about who owns onboarding at your company. If a product manager owns onboarding and iterates weekly, SaaS tools remove the developer bottleneck. If engineering owns it and treats tours as product code, a library gives them full control. The org chart matters more than the tech stack.

---

## Six scenarios where SaaS genuinely wins

### 1. Your onboarding owner can't write React

When product managers, marketers, or customer success teams own the onboarding experience, a SaaS visual editor removes the dependency on engineering entirely. They update copy, change targeting rules, and rearrange flow logic without filing a Jira ticket.

Tour Kit requires a developer for every change. A heading typo? Developer. New user segment? Developer. Rearranged steps? Developer.

If your onboarding changes weekly and the person making those decisions can't write JSX, a library creates a bottleneck that a SaaS tool eliminates.

### 2. You need onboarding live this week

Appcues estimates the minimum cost of building onboarding in-house at $45,018 upfront, requiring a UX designer, a PM, and three engineers over two months. Add $25,766/year in maintenance. Year-one total: $70,784 for a single flow.

SaaS tools deploy in under an hour. For an early-stage startup racing to reduce first-week churn (roughly 60% of users drop off within 7 days), speed is existential.

### 3. You need built-in analytics and A/B testing

SaaS platforms bundle segmentation, funnel tracking, and experimentation in one dashboard. With a library, you wire up PostHog or Mixpanel yourself, build your own segmentation logic, and either buy a separate A/B testing tool or skip experimentation altogether.

### 4. Onboarding spans more than just in-app

Modern onboarding involves email drips, in-app tours, push notifications, and sometimes SMS. SaaS platforms increasingly offer cross-channel orchestration. A React library covers the in-app layer and nothing else.

### 5. Enterprise compliance requirements

When enterprise customers demand SOC 2 Type II reports, data residency guarantees, and audit logs for every onboarding interaction, mature SaaS vendors (Pendo, WalkMe) have that infrastructure ready. Building it yourself takes months.

### 6. You manage 50+ flows across multiple products

At scale, the operational overhead of managing onboarding through code becomes real. Fifty flows means fifty files, and every copy change requires a pull request, a review, and a deploy. Non-engineers can't contribute.

---

## When libraries win instead

**Your MAU count is above 50K.** SaaS onboarding tools charge per monthly active user. Appcues starts at $300/month, Userflow at $595/month. At 100K+ MAU, you can easily hit $50K+/year. Tour Kit Pro is $99 once.

**Performance is a real constraint.** SaaS tools inject third-party JavaScript. We measured meaningful Core Web Vitals degradation. Tour Kit's core ships at under 8KB gzipped with zero runtime dependencies.

**Your design system is non-negotiable.** SaaS tool UI never perfectly matches your design tokens. A headless library renders your components.

**You're already a React shop with available engineering time.** AI-assisted development has compressed timelines significantly. ClickUp eliminated $200K annually in SaaS costs by building custom tools.

**Vendor lock-in worries you.** Migrating from Appcues to Userpilot means rebuilding every flow from scratch. Library code lives in your repo.

---

## The decision framework I actually recommend

Ask these four questions:

1. **Who owns onboarding at your company?** PM/marketer who ships weekly changes = lean SaaS. Engineering = lean library.

2. **What's your MAU trajectory?** Below 10K, SaaS is manageable. Above 50K, run the numbers. Above 100K, a library almost certainly wins on cost.

3. **How important is performance?** Consumer app competing on page speed = every third-party script hurts. B2B dashboard = the hit matters less.

4. **How many channels does onboarding span?** In-app only = library. In-app plus email plus mobile = platform.

There's a middle path too. Start with SaaS to validate your onboarding flows quickly. Once you know what works, migrate the proven flows to a library for long-term ownership.

---

The honest answer is that the market has room for both approaches. SaaS tools aren't going away. Neither are libraries. The question is which trade-offs your team can live with.

*Suggest submitting to: JavaScript in Plain English, Better Programming, or The Startup on Medium.*
