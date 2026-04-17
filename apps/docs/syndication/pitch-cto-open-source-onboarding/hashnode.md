---
title: "How to pitch your CTO on switching from SaaS to open-source onboarding"
slug: "pitch-cto-open-source-onboarding"
canonical: https://usertourkit.com/blog/pitch-cto-open-source-onboarding
tags: react, javascript, web-development, open-source
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/pitch-cto-open-source-onboarding)*

# How to pitch your CTO on switching from SaaS to open-source onboarding

You know the SaaS onboarding tool your team uses is the wrong fit. The bundle is bloated, the no-code editor creates flows nobody reviews, and finance just flagged a 15% renewal uplift on the annual contract. Knowing it's wrong and getting your CTO to approve a switch are two different problems.

This guide is for the internal champion: the senior engineer or engineering lead who needs to build a CTO-ready case for replacing a SaaS onboarding platform with an open-source library. Not a from-scratch build. A maintained, typed, MIT-licensed library that your team owns and ships like any other dependency.

```bash
npm install @tourkit/core @tourkit/react
```

We built [Tour Kit](https://tourkit.dev/docs), so take everything here with appropriate skepticism. The arguments hold regardless of which library you choose.

## What is open-source onboarding?

Open-source onboarding is a code-first approach where product tours, tooltips, and feature announcements are built using MIT-licensed React libraries that ship inside your application bundle, rather than injected by a third-party SaaS vendor's external script. As of April 2026, libraries like Tour Kit ship at under 8KB gzipped with zero runtime dependencies, compared to 50-200KB of uncontrollable injected scripts from SaaS alternatives.

## Why the "build vs buy" framing is wrong

Every existing analysis presents two options: build from scratch ($60K-$3M) or buy SaaS ($36K-$48K/year). This binary misses the third path that 97% of modern applications already use: adopting an open-source library. One sprint of integration, $0/month ongoing.

## The cost math

| Factor | SaaS (Appcues/Pendo) | Open-source library |
|--------|----------------------|---------------------|
| Year 1 (10K MAU) | $36,000-$48,000 | $5,000-$15,000 (eng time) |
| Year 2 | $39,000-$57,000 (5-20% uplift) | $0 licensing |
| Year 3 cumulative | $115,000-$160,000+ | $5,000-$20,000 total |
| Bundle size | 50-200KB+ injected | 8KB gzipped |
| Code ownership | Zero | Full, MIT license |

Crossover point: two to four months.

## The security argument

SaaS tools inject third-party JavaScript from an external CDN. You can't audit it, pin it, or control when it updates. OSS vulnerabilities patch in ~8 hours vs ~7 days for proprietary software. For SOC 2/GDPR/HIPAA teams, bundled library code is materially easier to document.

## Seven CTO objections (summarized)

1. **"Not free"** — Library adoption costs hours, not $60K.
2. **"Maintenance risk"** — MIT = forkable. SaaS sunset = total loss.
3. **"Need SLAs"** — SaaS SLAs cover uptime, not your onboarding logic.
4. **"Security"** — Favors open source. Auditable vs opaque injection.
5. **"No-code editor"** — Legitimate constraint. Address workflow honestly.
6. **"License risk"** — MIT is permissive. No GPL contamination.
7. **"Painful switch"** — Lock-in grows monthly. Move before 200 flows are encoded in a vendor's format.

## The pitch format

- Problem statement (2 sentences)
- Proposed alternative (3 sentences)
- Three-year TCO table
- Risk mitigation bullets
- Ask: one-sprint spike, three flows, measurable results

Full article with detailed objection handling and FAQ: [usertourkit.com/blog/pitch-cto-open-source-onboarding](https://usertourkit.com/blog/pitch-cto-open-source-onboarding)
