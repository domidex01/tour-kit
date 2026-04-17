# Why I chose MIT over AGPL and BSL for my React library

## The licensing wars taught me what not to do

*Originally published at [usertourkit.com](https://usertourkit.com/blog/why-we-open-sourced-tour-kit-mit-not-agpl-bsl)*

I spent months building Tour Kit, a headless product tour library for React split across 10 composable packages. When it came time to pick a license, the decision took about fifteen minutes.

MIT. Done.

But that fifteen minutes followed weeks of watching the open source licensing wars play out. HashiCorp. Redis. Elastic. MongoDB. Every few months, another company switched to a restrictive license, got forked, and ended up worse off than before. I didn't want to repeat that pattern. More importantly, I didn't want to build a library that developers had to run past their legal team before installing.

Here's the reasoning, the tradeoffs I accepted, and what I think the license-change pattern actually tells us about building sustainable open source in 2026.

## Why I ruled out AGPL

AGPL sounds reasonable on paper. Use the code for free. Modify it, deploy it as a service, share your changes. Copyleft for the cloud era.

In practice, AGPL kills adoption for developer libraries.

Google has a company-wide ban on AGPL-licensed software. Not a recommendation, a ban. Any developer inside Google can't use an AGPL library without a legal exception. For a React library that might end up inside dashboards at Fortune 500 companies, that's a massive slice of potential users gone before they write a single line of code.

Shepherd.js, one of the most popular product tour libraries, uses exactly this model. The core is AGPL-3.0 with a commercial license requirement for any revenue-generating product, SaaS application, or closed-source project. Even internal dashboards at for-profit companies need a commercial license.

That's not technically wrong. Shepherd.js needs revenue, and dual-licensing is a legitimate model. But it creates friction I wanted to avoid: a developer evaluates the library, builds a proof of concept, gets buy-in from their team, and then discovers they need a commercial license to ship. The AGPL wall shows up after the investment.

Armin Ronacher, who built Flask, described this dynamic bluntly: the AGPL became "the perfect base license to make dual licensing with a commercial license feasible." A toll gate disguised as open source.

## Why I ruled out BSL

Business Source License is the newer alternative. Code is source-available but not truly open source. After a specified period (usually 2-4 years), it converts to a permissive license. In the meantime, the original company controls commercial use.

The track record is grim.

HashiCorp switched Terraform from MPL to BSL in August 2023. Within five days, the OpenTofu fork launched. Redis moved from BSD to RSALv2 in March 2024. Valkey forked within 30 days under the Linux Foundation. As of April 2026, Valkey has 19.8K GitHub stars, over 1,000 commits from 150+ contributors. An estimated 83% of enterprises migrated away from Redis within months.

HashiCorp was acquired by IBM for $6.4 billion in February 2025. Acquired, not IPO'd. The BSL didn't create a moat. It created a fork and an exit.

For a solo developer building a React library, BSL made even less sense. I'm not competing with AWS. Nobody is going to take Tour Kit and offer "managed Tour Kit as a service." The threat BSL defends against doesn't apply to UI libraries.

## What MIT actually costs me

I won't pretend MIT is costless. Anyone can take Tour Kit's code, fork it, sell it, and never contribute back. That's the deal.

A company could use Tour Kit across 500 internal dashboards and never pay a dollar. The typical open source user-to-customer conversion rate sits around 1%. That means 99 out of 100 users will never pay. I accepted that math.

These are real tradeoffs. But restricting usage to capture more revenue creates forks, not revenue.

## How the open core model works

Tour Kit's core packages are MIT and always will be. The extended packages (adoption tracking, analytics, announcements, checklists, media, scheduling, surveys) are proprietary with a one-time license fee.

The license boundary follows the value boundary. As the Open Core Ventures Handbook puts it: "Free covers the use case that creates awareness, paid covers the use case that creates value at scale."

AG Grid, MUI X, and Grafana all do variations of this. Nobody complains that Grafana Enterprise costs money because Grafana OSS is genuinely useful on its own.

The key constraint: the free packages can never feel artificially crippled. If the MIT core can't stand alone as a solid product tour library, the model fails.

## The license-change graveyard

MongoDB switched from AGPL to SSPL in 2018. Elastic went from Apache 2.0 to SSPL in 2021. HashiCorp went BSL in 2023. Redis went RSALv2 in 2024.

Every single one got forked. None achieved the stated goal. Elastic actually reversed course, adding AGPL back in August 2024. An implicit admission that the restriction didn't work.

The lesson: if you're going to be MIT, be MIT from day one. The trust penalty for changing later is asymmetric. Going from MIT to AGPL destroys trust instantly. Going back recovers trust slowly, if at all.

## Why spreadability matters for UI libraries

As of 2025, MIT appears in 92% of open source projects reviewed by the OSSRA report. React is MIT. Next.js is MIT. Tailwind is MIT. Every tool in the stack Tour Kit sits alongside is MIT.

When a developer evaluates a product tour library, the license check takes about three seconds. MIT? Install it. AGPL? Google "AGPL commercial use" and probably move on.

A UI library has zero lock-in. Nobody is stuck with a product tour library. The switching cost is a weekend of work. If your license creates any friction, developers will just use the MIT alternative.

Tour Kit needs to spread. MIT is the only license that doesn't create a reason to say "no."

---

*Tour Kit is a headless product tour library for React. MIT core, paid extensions. [usertourkit.com](https://usertourkit.com/)*

---

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, The Startup, Towards Dev
