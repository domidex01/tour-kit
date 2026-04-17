# How to Convince Your CTO to Replace Expensive Onboarding SaaS With Open Source

## The internal champion's playbook for switching from $48K/year tools to code-owned alternatives

*Originally published at [usertourkit.com](https://usertourkit.com/blog/pitch-cto-open-source-onboarding)*

You know the SaaS onboarding tool your team uses is the wrong fit. The bundle is bloated, the no-code editor creates flows nobody reviews, and finance just flagged a 15% renewal uplift on the annual contract. Knowing it's wrong and getting your CTO to approve a switch are two different problems.

This guide is for the internal champion: the senior engineer or engineering lead who needs to build a CTO-ready case for replacing a SaaS onboarding platform with an open-source library.

We built Tour Kit, so take everything here with appropriate skepticism. The arguments hold regardless of which library you choose.

## The "Build vs Buy" Framing Is Wrong

Every analysis of onboarding tooling presents two options: build from scratch (expensive, slow) or buy SaaS (fast, recurring cost). This binary misses the third path that 97% of modern applications already use for other concerns: adopting an open-source library.

Building from scratch costs $60,000 for a startup and up to $3 million at enterprise scale. Atlassian reportedly spent $3 million over three years.

Buying SaaS means $3,000 to $4,000 per month at 10,000 MAU. That's $36,000 to $48,000 annually before the renewal uplift hits.

Adopting an MIT-licensed library costs one sprint of integration work and $0/month ongoing. The positioning engine, state machine, and accessibility layer come pre-built.

## The Cost Math

Over three years at 10K MAU:

**SaaS route:** $115,000 to $160,000+ (with 5-20% annual renewal uplifts)

**Open-source library:** $5,000 to $20,000 total (one-time engineering integration)

The crossover point is typically two to four months. A developer on Reddit reported being quoted "$30k USD just to use Pendo's webhook."

## The Security Argument

SaaS onboarding tools inject third-party JavaScript from an external CDN. The vendor's script loads asynchronously, reads your DOM, then renders overlays. You don't control updates. You can't audit what data it reads. You can't pin a version.

An open-source library is bundled at build time. Audited by your lockfile. Pinned to your chosen version. No external network request.

Open-source vulnerabilities get patched in roughly 8 hours on average, compared to 7 days for proprietary software.

For SOC 2, GDPR, or HIPAA teams, the difference between injecting an opaque third-party script and bundling an auditable MIT-licensed library is the difference between a compliance finding and a clean report.

## Seven CTO Objections

I won't reproduce the full responses here (the original article has detailed answers with citations), but the seven most common objections are:

1. "Open source isn't free" — Correct for custom builds. Wrong for library adoption.
2. "What if it stops being maintained?" — MIT license means you can fork. SaaS sunset means you lose everything.
3. "We need SLAs" — SaaS SLAs cover platform uptime, not your onboarding logic.
4. "Security concerns" — This one actually favors open source.
5. "Our PM uses the no-code editor" — Legitimate constraint. Address it directly.
6. "License compliance risk" — MIT is permissive. No GPL contamination.
7. "Switching will be painful" — Vendor lock-in grows every month you delay.

## How to Structure the Pitch

Don't send a Slack essay. Structure it as a 10-minute conversation:

**Problem statement:** We spend $X/year on [tool] and engineers work around its limitations. Renewal is [date].

**Proposed alternative:** Replace [tool] with [library]. MIT-licensed, ships at [size] gzipped.

**Cost comparison:** Three-year TCO table.

**Risk mitigation:** MIT license (forkable), no third-party injection, gradual migration.

**The ask:** Approve a one-sprint spike to rebuild three existing flows. If it's worse, we renew.

The spike is the key. Don't ask for a full migration commitment. Ask for permission to prove the concept.

## Common Mistakes

Leading with ideology instead of math. Asking for full migration upfront. Ignoring the product team's workflow. Underestimating process lock-in. Burying the security angle.

The full article with code examples, comparison tables, and a detailed FAQ is at [usertourkit.com/blog/pitch-cto-open-source-onboarding](https://usertourkit.com/blog/pitch-cto-open-source-onboarding).

*Suggested publications: JavaScript in Plain English, Better Programming, The Startup*
