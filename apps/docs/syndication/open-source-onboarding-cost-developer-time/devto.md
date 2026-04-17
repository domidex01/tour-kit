---
title: "Your 'free' onboarding library probably costs $12,000/year in dev time"
published: false
description: "We calculated the real cost of open source product tour libraries — integration, maintenance, framework upgrades, and abandoned projects. The math isn't pretty."
tags: react, opensource, webdev, productivity
canonical_url: https://usertourkit.com/blog/open-source-onboarding-cost-developer-time
cover_image: https://usertourkit.com/og-images/open-source-onboarding-cost-developer-time.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/open-source-onboarding-cost-developer-time)*

# Open source onboarding: what $0 actually costs in developer time

Your team picked an open source product tour library because it was free. Six months later, a developer has spent 120 hours patching it, working around its quirks, and building the analytics layer it didn't include. At $100/hour, that "free" library just cost $12,000. And you still don't have checklists.

This isn't hypothetical. It's the pattern we see repeated across the React ecosystem, and it's the pattern that led us to build [Tour Kit](https://tourkit.dev/docs). The math doesn't lie, even when the npm install is free.

```bash
npm install @tourkit/core @tourkit/react
```

## The problem: zero-dollar price tags hide five-figure costs

Open source onboarding libraries cost nothing to install but anywhere from $10,000 to $20,000 in developer time during the first year of real-world use, based on typical integration and maintenance hours at US developer rates. That disconnect between the npm price tag and the actual total cost of ownership is what drives teams to make expensive decisions they don't recognize as expensive until months later.

According to [Userpilot's build-vs-buy analysis](https://userpilot.com/blog/build-vs-buy-user-onboarding/), a startup building onboarding in-house spends roughly $60,000 over two months when you account for UX design, product management, and developer time. Mid-market companies hit $200,000 over six to twelve months. Atlassian reportedly spent $3.5 million across three years.

Even adopting an existing library doesn't eliminate most of those costs. You still need a developer to integrate, customize, test, and maintain it. The library handles maybe 30% of the work.

The [2024 Tidelift State of the Open Source Maintainer Report](https://byteiota.com/open-source-maintainer-crisis-60-unpaid-burnout-hits-44/) found that enterprises underestimate software costs by 2x to 4x. For "free" libraries, the underestimate is worse because the price tag creates a cognitive anchor at zero.

## The five hidden costs nobody mentions

The real cost of an open source onboarding library hides across five categories that never appear as line items in your sprint planning, your quarterly budget, or your team's capacity model. They accumulate silently in places that are hard to track and easy to ignore until someone asks why the tour broke again.

### 1. Integration and customization

Most open source tour libraries give you a tooltip and a step counter. Your product team wants branded tooltips, conditional branching, user segmentation, and analytics. That gap between what the library provides and what your product requires is filled entirely with your developer's time.

At US developer rates of $70 to $150 per hour ([PixelCrayons, 2026](https://www.pixelcrayons.com/blog/software-development/guide-on-software-developer-hourly-rate/)), 40 hours of integration and customization costs $2,800 to $6,000. That's before a single user sees the tour.

### 2. The selector maintenance tax

Every time your UI changes, your tour selectors might break. A renamed CSS class, a restructured component tree, a refactored layout. Nobody measures this cost, but we estimate it at 2-5 hours per month for active products. That's $200 to $750 monthly at typical rates, just keeping existing tours from breaking.

### 3. React version upgrades

Shepherd.js has an open [React 19 compatibility issue (#3102)](https://github.com/shipshapecode/shepherd/issues/3102) as of April 2026. When your framework moves forward and your tour library doesn't, you're stuck choosing between delaying the upgrade or rewriting the integration. Either option costs weeks.

React-Shepherd's repository is no longer maintained. Development moved to the main Shepherd repo. If you built on the React wrapper, you're now migrating without a guide.

### 4. The feature creep timeline

It starts with product tours. Three months in, the product team asks for analytics. By month six, they want onboarding checklists, and before the year ends, someone requests feature announcements. Each new requirement means evaluating another library, building another integration, or writing more custom code.

### 5. Abandoned library risk

The open source maintainer ecosystem is in trouble. The 2024 Tidelift report found that 60% of maintainers work unpaid. 44% cite burnout. 60% have quit or considered quitting their projects.

This isn't abstract risk. Kubernetes Ingress NGINX was retired in November 2025 due to maintainer burnout, with security patches ending March 2026. The XZ Utils backdoor? Traced to the original maintainer's burnout, first reported in June 2022. React-virtualized hasn't shipped a release since December 2020.

When your tour library's maintainer stops responding, migrating costs 40 to 80 hours for a mid-size app. At typical rates, that's $4,000 to $12,000.

## The real math: open source vs. SaaS vs. code-owned

When you add up integration hours, monthly maintenance, and the inevitable feature add-ons across a full year, a "free" open source library typically costs $10,000 to $20,000 in developer time while a code-owned alternative like Tour Kit lands between $1,100 and $2,200.

| Cost category | Open source library | SaaS tool (Appcues/Userpilot) | Code-owned library (Tour Kit) |
|---|---|---|---|
| License cost (year 1) | $0 | $3,600-$9,000/yr | $0 (MIT) or $99 one-time (Pro) |
| Integration time | 40-80 hours | 4-8 hours | 8-16 hours |
| Monthly maintenance | 5-10 hours | 1-2 hours | 1-3 hours |
| Analytics add-on | 20-40 hours custom build | Built in | Built in |
| Checklists add-on | 40-60 hours custom build | Built in (higher tier) | Built in |
| Year 1 total (at $100/hr) | $10,000-$20,000+ | $4,400-$11,400 | $1,100-$2,200 |
| Year 2 total | $6,000-$12,000 | $4,800-$11,400 | $1,200-$3,600 |
| You own the code | Yes (with caveats) | No | Yes |
| Vendor lock-in risk | Low (but migration cost) | High | Low |

The "free" option is the most expensive in year one. It catches up to SaaS pricing by year two. And it never includes the features that SaaS tools bundle.

**Bias disclosure:** We built Tour Kit, so we have an obvious stake in this comparison. Every number in the table above is verifiable. The integration and maintenance time estimates come from our own experience building onboarding across multiple React projects. Your mileage will vary based on team size, product complexity, and how much customization you need.

## The counterargument: when open source is the right call

Open source onboarding libraries remain the right choice for prototypes, simple static tours under 10 steps, and teams with deep React expertise who genuinely don't need analytics or checklists.

React Joyride gets you a working prototype in an afternoon. It has over 600K weekly downloads for a reason. The API is straightforward, the community is large, and "good enough" is genuinely good enough for an MVP.

Simple requirements change the equation too. If your tours are 5-10 static steps with no analytics or conditional logic, maintenance stays manageable.

The problem isn't open source itself. It's the assumption that "free" means "low cost." ([Opensource.com](https://opensource.com/article/17/2/hidden-costs-free-software) calls this the "free as in puppy" problem: the acquisition cost is zero, but the ongoing care is substantial.)

## What we'd do differently

**Start with the 12-month question.** Not "which library is free?" but "what will our onboarding system need to do in 12 months?" If the answer includes analytics, checklists, or user segmentation, factor that into the cost from day one.

**Calculate developer time honestly.** Use your team's actual hourly cost (salary + benefits + overhead, typically 1.5x to 2x the base rate). Multiply by realistic hours, not optimistic ones.

**Check the bus factor.** How many active maintainers does the library have? When was the last release? Shepherd.js has 20 contributors. React Joyride is largely one person's project.

**Budget for the migration you'll probably need.** Whether you're leaving an abandoned library or escaping a SaaS tool that raised prices, the exit cost matters. Code-owned solutions have the lowest migration cost because you already understand the codebase.

---

Tour Kit isn't free of tradeoffs. It requires React 18 or later, has no visual builder, and its community is smaller than React Joyride's. But the core is MIT-licensed, the bundle is under 8KB gzipped, and the extended packages cover what you'll need in month six without a custom build.

Get started with [Tour Kit](https://tourkit.dev/docs) or browse the [GitHub repo](https://github.com/AmanDubeyCS/tour-kit).
