---
title: "What is vendor lock-in? Why onboarding tools are the worst offenders"
published: false
description: "Switching costs for SaaS onboarding platforms can hit 150-200% of your annual contract value. Here's why onboarding tools are uniquely prone to vendor lock-in, and how headless architecture prevents it."
tags: react, webdev, opensource, saas
canonical_url: https://usertourkit.com/blog/what-is-vendor-lock-in
cover_image: https://usertourkit.com/og-images/what-is-vendor-lock-in.png
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
| Data lock-in | Your analytics, user segments, and event history live in the vendor's database | Pendo Data Sync exports Avro files on a 1 to 24 hour batch cadence with no real-time access and no universal event IDs ([Userpilot analysis](https://userpilot.com/blog/pendo-data-sync/)) |
| Integration lock-in | Custom integrations with your stack must be rebuilt for any alternative | Appcues limits two-way integrations to its Growth plan. Userpilot CSV exports cover user-level data only, not event streams |
| Process lock-in | Your team's knowledge, workflows, and training are tied to one vendor's UI | PMs trained on a proprietary visual builder can't transfer that skill to another tool |
| Contractual lock-in | Auto-renewal clauses, multi-year commitments, short cancellation windows | Annual contracts with 30-day renewal notice periods that catch teams off guard |

Process lock-in is the one nobody talks about at contract time. When your product team has built 50 onboarding flows in a proprietary visual builder, the switching cost isn't code. It's content. Every tour, tooltip, checklist, and survey must be recreated from scratch in a new tool. That content migration tax is unique to onboarding.

## Why vendor lock-in matters for onboarding tools

Onboarding tools carry higher lock-in risk than most SaaS categories because they sit between your product and your users, accumulate irreplaceable content over time, and store data in formats that resist portability. These three factors compound in ways that generic SaaS tools don't.

First, onboarding tools *create* user behavior rather than just observing it. An analytics platform watches what users do. An onboarding platform guides users through activation flows, feature adoption, and retention nudges. Ripping it out means rebuilding the experience your users depend on.

Second, onboarding platforms accumulate content over time. A single tour is easy to migrate. Forty tours, fifteen checklists, and eight NPS surveys designed over two years? That's a project nobody wants to staff.

Third, the data is uniquely hard to export. Pendo's Snowflake integration requires what Userpilot bluntly calls "total vendor lock-in," incompatible with BigQuery, Redshift, or AWS data lake architectures. Maintenance costs can reach 20% of the software license fee annually, potentially surpassing the original cost over time ([DEV Community](https://dev.to/talweezy/why-vendor-lock-in-is-costing-you-more-than-you-think-2hfp)).

## Vendor lock-in examples

AWS CodeCommit's sunset illustrates the risk clearly: Amazon deprecated the service in July 2024, cutting off new repository creation and eventually forcing teams to migrate elsewhere. Teams that had built CI/CD pipelines, branch policies, and automation scripts around CodeCommit's proprietary features faced weeks of rework ([Daytona analysis](https://www.daytona.io/dotfiles/vendor-lock-in-risks-lessons-from-aws-codecommit-s-sunset)).

In the onboarding space, the pattern plays out more quietly. A team outgrows Appcues' event limits, or Pendo's pricing restructures, or WalkMe's enterprise minimums exceed budget. The migration starts, and the real cost becomes visible.

## How headless architecture prevents lock-in

Tour Kit addresses vendor lock-in by keeping tour definitions in your codebase as React components, routing event data to your own analytics providers, and using MIT licensing on core packages so you can fork, modify, and self-host without permission. If you stop using Tour Kit tomorrow, you still have the code.

Specifically:

- Tour definitions live in `.tsx` files you own, tracked in version control
- Event data flows to your analytics provider (PostHog, Mixpanel, Amplitude). Tour Kit doesn't store it
- No proprietary data formats. Configuration is TypeScript objects
- MIT-licensed core packages. You can fork, modify, and self-host

This maps to what Martin Fowler describes as the [headless component pattern](https://martinfowler.com/articles/headless-component.html), separating logic from presentation so neither side creates a dependency you can't escape.

There's a tradeoff: Tour Kit requires React developers and doesn't have a visual builder. That's a genuine limitation for teams where PMs create flows independently. But it also means zero process lock-in. Your team's knowledge is React and TypeScript, not a proprietary drag-and-drop interface.

A Percona survey found that 62% of organizations use open-source software specifically to avoid vendor lock-in ([Percona, 2025](https://www.percona.com/blog/can-open-source-software-save-you-from-vendor-lock-in/)). The EU Data Act, effective September 2025, now mandates machine-readable export formats and anti-lock-in provisions for SaaS vendors operating in Europe. A regulatory signal that this concern isn't going away.

```bash
npm install @tourkit/core @tourkit/react
```

Browse the full API at [usertourkit.com](https://usertourkit.com/).

## FAQ

### What is vendor lock-in in simple terms?

Vendor lock-in happens when switching from one software provider to another becomes so expensive or complex that you're effectively stuck. The costs include rebuilding integrations, retraining teams, and recreating content. For onboarding tools specifically, switching means rebuilding every tour and flow from scratch in a new platform.

### How do you avoid vendor lock-in with onboarding tools?

Define tours in code rather than proprietary visual builders. Send event data to your own analytics stack instead of the vendor's database. Use open-source libraries with standard formats. Tour Kit stores tour definitions as TypeScript in your codebase and routes analytics to providers you already use, so nothing is trapped in a third-party system.

### Is vendor lock-in always bad?

Not necessarily. Vendor lock-in is a tradeoff: you accept dependency in exchange for speed, convenience, or capabilities you can't build yourself. The problem is when lock-in is invisible at purchase time and only surfaces when you try to leave. Developers call the antidote "architect for exit," meaning choose tools that let you leave even if you never plan to.

### What does the EU Data Act mean for onboarding tool vendors?

The EU Data Act, effective September 2025, requires SaaS vendors to provide machine-readable data export formats and reduce switching barriers. Onboarding platforms operating in Europe must offer real data portability, not just CSV dumps of user profiles. As of April 2026, most onboarding vendors haven't publicly addressed compliance.
