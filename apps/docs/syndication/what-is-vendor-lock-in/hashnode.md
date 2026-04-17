---
title: "What is vendor lock-in? Why it matters for onboarding tools"
slug: "what-is-vendor-lock-in"
canonical: https://usertourkit.com/blog/what-is-vendor-lock-in
tags: react, javascript, web-development, saas, open-source
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-vendor-lock-in)*

# What is vendor lock-in? Why it matters for onboarding tools

You pick an onboarding platform, build 40 tours in its visual builder, train your PM team on its workflow, pipe events into its proprietary analytics. Then pricing doubles. Moving feels impossible. That's vendor lock-in, and onboarding tools are uniquely prone to it.

## Definition

Vendor lock-in is a company's dependence on a specific vendor's proprietary technology, data formats, or workflows that makes switching to a competitor prohibitively expensive. As of April 2026, switching costs can add an exit tax of 150 to 200% of your annual contract value, according to [CloudNuro's SaaS lock-in analysis](https://www.cloudnuro.ai/blog/saas-vendor-lock-in). For a team paying $24,000/year for an onboarding platform, that works out to $36,000 to $48,000 in real migration costs, before accounting for the weeks your team spends rebuilding flows from scratch.

The term isn't new. But the scale is. The average enterprise now manages 291 SaaS applications, up from 110 in 2020 ([Libertify SaaS Trends 2026](https://www.libertify.com/interactive-library/saas-trends-2026/)). Each one is a potential lock-in surface.

## How vendor lock-in works

Vendor lock-in in SaaS follows four distinct patterns identified in [Zluri's SaaS vendor lock-in taxonomy](https://www.zluri.com/blog/saas-vendor-lock-ins), and onboarding tools are particularly susceptible because they touch all four simultaneously, from data to contracts to team workflows.

| Lock-in type | What it looks like | Onboarding tool example |
|---|---|---|
| Data lock-in | Your analytics, user segments, and event history live in the vendor's database | Pendo Data Sync exports Avro files on a 1 to 24 hour batch cadence with no real-time access |
| Integration lock-in | Custom integrations with your stack must be rebuilt for any alternative | Appcues limits two-way integrations to its Growth plan |
| Process lock-in | Your team's knowledge, workflows, and training are tied to one vendor's UI | PMs trained on a proprietary visual builder can't transfer that skill |
| Contractual lock-in | Auto-renewal clauses, multi-year commitments, short cancellation windows | Annual contracts with 30-day renewal notice periods |

Process lock-in is the one nobody talks about at contract time. When your product team has built 50 onboarding flows in a proprietary visual builder, the switching cost isn't code. It's content. Every tour, tooltip, checklist, and survey must be recreated from scratch in a new tool.

## Why vendor lock-in matters for onboarding tools

Onboarding tools carry higher lock-in risk than most SaaS categories because they sit between your product and your users, accumulate irreplaceable content over time, and store data in formats that resist portability.

First, onboarding tools *create* user behavior rather than just observing it. Ripping it out means rebuilding the experience your users depend on.

Second, onboarding platforms accumulate content over time. Forty tours, fifteen checklists, and eight NPS surveys designed over two years? That's a project nobody wants to staff.

Third, the data is uniquely hard to export. Maintenance costs can reach 20% of the software license fee annually ([DEV Community](https://dev.to/talweezy/why-vendor-lock-in-is-costing-you-more-than-you-think-2hfp)).

## How headless architecture prevents lock-in

Tour Kit addresses vendor lock-in by keeping tour definitions in your codebase as React components, routing event data to your own analytics providers, and using MIT licensing on core packages.

- Tour definitions live in `.tsx` files you own, tracked in version control
- Event data flows to your analytics provider (PostHog, Mixpanel, Amplitude)
- No proprietary data formats. Configuration is TypeScript objects
- MIT-licensed core packages. Fork, modify, and self-host

This maps to what Martin Fowler describes as the [headless component pattern](https://martinfowler.com/articles/headless-component.html).

A Percona survey found that 62% of organizations use open-source software specifically to avoid vendor lock-in ([Percona, 2025](https://www.percona.com/blog/can-open-source-software-save-you-from-vendor-lock-in/)).

```bash
npm install @tourkit/core @tourkit/react
```

Full API docs at [usertourkit.com](https://usertourkit.com/).
