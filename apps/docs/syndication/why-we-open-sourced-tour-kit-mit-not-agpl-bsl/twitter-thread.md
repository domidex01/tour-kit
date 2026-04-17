## Thread (7 tweets)

**1/** I spent months building a 10-package React library. Picking the license took 15 minutes.

MIT. Not AGPL. Not BSL. Here's why that was the easiest decision of the project:

**2/** AGPL has a Google company-wide ban. Shepherd.js (a competitor) uses AGPL for its core — meaning any commercial product needs a paid license just to ship.

The friction shows up AFTER a developer has already built the proof of concept. That's a wall, not a gate.

**3/** BSL has a 100% fork rate.

HashiCorp → OpenTofu (5 days)
Redis → Valkey (30 days, 19.8K stars in year one)
Elastic → OpenSearch (then Elastic reversed course in 2024)

No company that switched to BSL achieved the revenue goal. They just got forked.

**4/** MIT costs me something real: ~99% of users will never pay.

A company could use Tour Kit across 500 dashboards and owe nothing. That's the deal. I accepted the math because the alternative (restrictive licenses) creates forks, not revenue.

**5/** The model that works: open core.

3 MIT packages (core, react, hints) — free forever.
8 proprietary packages (analytics, checklists, surveys, etc.) — one-time fee.

The license boundary follows the value boundary. Same playbook as AG Grid, MUI X, Grafana.

**6/** 92% of open source projects now use MIT (2025 OSSRA report).

React, Next.js, Tailwind, Radix UI, shadcn/ui — every tool in the stack is MIT.

When a developer checks your license and sees AGPL, they Google "AGPL commercial use" and move on. 3-second decision.

**7/** Full breakdown with the license comparison table, data from HashiCorp/Redis/Elastic, and the Shepherd.js AGPL case study:

https://usertourkit.com/blog/why-we-open-sourced-tour-kit-mit-not-agpl-bsl
