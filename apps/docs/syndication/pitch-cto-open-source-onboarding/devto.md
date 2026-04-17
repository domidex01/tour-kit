---
title: "The pitch deck that got my CTO to drop our $48k/yr onboarding SaaS"
published: false
description: "A framework for convincing your CTO to replace SaaS onboarding tools with an open-source library. Includes the TCO math, security arguments, and 7 objection responses."
tags: react, opensource, webdev, productivity
canonical_url: https://usertourkit.com/blog/pitch-cto-open-source-onboarding
cover_image: https://usertourkit.com/og-images/pitch-cto-open-source-onboarding.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/pitch-cto-open-source-onboarding)*

# How to pitch your CTO on switching from SaaS to open-source onboarding

You know the SaaS onboarding tool your team uses is the wrong fit. The bundle is bloated, the no-code editor creates flows nobody reviews, and finance just flagged a 15% renewal uplift on the annual contract. Knowing it's wrong and getting your CTO to approve a switch are two different problems.

This guide is for the internal champion: the senior engineer or engineering lead who needs to build a CTO-ready case for replacing a SaaS onboarding platform with an open-source library. Not a from-scratch build. A maintained, typed, MIT-licensed library that your team owns and ships like any other dependency.

```bash
npm install @tourkit/core @tourkit/react
```

We built [Tour Kit](https://tourkit.dev/docs), so take everything here with appropriate skepticism. The arguments hold regardless of which library you choose. The case for code-owned onboarding is structural, not brand-specific.

## What is open-source onboarding?

Open-source onboarding is a code-first approach where product tours, tooltips, checklists, and feature announcements are built using MIT-licensed React libraries that ship inside your application bundle, rather than injected by a third-party SaaS vendor's external script. Unlike platforms like Appcues or Pendo that charge per monthly active user and control the rendering pipeline, an open-source library gives engineering teams full ownership of the onboarding logic, styling, and deployment lifecycle.

## Why the "build vs buy" framing is wrong

Every existing analysis of onboarding tooling presents two options: build from scratch (expensive, slow) or buy SaaS (fast, recurring cost). This binary misses the third path that 97% of modern applications already use for other concerns, which is adopting an open-source library.

- Building from scratch: $60,000 (startup) to $3M (enterprise). Atlassian spent $3M over three years.
- Buying SaaS: $36,000-$48,000/year at 10K MAU before renewal uplifts.
- Adopting an MIT library: One sprint integration, $0/month ongoing.

## The cost math your CTO actually needs

| Factor | SaaS (Appcues/Pendo) | Open-source library |
|--------|----------------------|---------------------|
| Year 1 (10K MAU) | $36,000-$48,000 | $5,000-$15,000 (eng time) |
| Year 2 | $39,000-$57,000 (5-20% uplift) | $0 licensing |
| Year 3 cumulative | $115,000-$160,000+ | $5,000-$20,000 total |
| Per-seat/MAU scaling | Cost increases with growth | Flat, no per-user pricing |
| Bundle size | 50-200KB+ injected | 8KB gzipped (tree-shakeable) |
| Training per engineer | $1,200/year | One-time ramp |
| Code ownership | Zero | Full, MIT license |

The crossover point is typically two to four months.

## The security argument

SaaS onboarding tools inject third-party JavaScript from an external CDN. The vendor's script loads asynchronously, reads your DOM, then renders overlays. You don't control updates. You can't audit what data it reads. You can't pin a version.

An open-source library is bundled at build time. Audited by your lockfile. Pinned to your chosen version. No external network request.

OSS vulnerabilities patch in ~8 hours vs ~7 days for proprietary software. For SOC 2, GDPR, or HIPAA teams, the difference between injected scripts and bundled libraries is the difference between a compliance finding and a clean report.

## Seven CTO objections

**1. "Open source isn't free"** — Correct for building from scratch. Wrong for library adoption. Integration is hours, not months.

```tsx
import { TourProvider, Tour, TourStep } from '@tourkit/react';

export function OnboardingTour() {
  return (
    <TourProvider>
      <Tour tourId="onboarding">
        <TourStep target="#dashboard-nav" title="Navigation">
          Your main dashboard controls live here.
        </TourStep>
      </Tour>
    </TourProvider>
  );
}
```

**2. "What if it stops being maintained?"** — MIT license = you can fork. SaaS sunset = you lose everything.

**3. "We need SLAs"** — SaaS SLAs cover uptime, not your onboarding logic. If Pendo's DOM detection breaks after your CSS refactor, you file a ticket and wait. With a library, your team fixes it same-sprint.

**4. "Security concerns"** — This one favors open source. Auditable code vs opaque third-party injection.

**5. "Our PM uses the no-code editor"** — Legitimate. But are those flows reviewed? Tested? Deployed through CI?

**6. "License compliance"** — Tour Kit uses MIT. No GPL/AGPL contamination risk. Compare Shepherd.js (AGPL).

**7. "Switching will be painful"** — Vendor lock-in grows every month. Process lock-in (team thinking in vendor patterns) is the most underestimated dimension.

## How to structure the pitch

Don't send a Slack essay. Use this format:

- **Problem:** We spend $X/year on [tool], engineers work around its limits, renewal is [date].
- **Alternative:** Replace with [library]. MIT-licensed, [size] gzipped, [specific features].
- **Cost comparison:** Three-year TCO table.
- **Risk mitigation:** MIT license (forkable), no script injection, parallel migration.
- **Ask:** One-sprint spike. Three flows. If it's worse, we renew.

The spike is the key. Don't ask for migration. Ask for permission to prove the concept.

## Common mistakes

1. Leading with ideology instead of math
2. Asking for full migration upfront (triggers loss aversion)
3. Ignoring the product team's no-code workflow
4. Underestimating process lock-in (cognitive, not just contractual)
5. Burying the security angle (for SOC 2/HIPAA orgs, this alone justifies the switch)

---

Full article with FAQ and detailed objection handling: [usertourkit.com/blog/pitch-cto-open-source-onboarding](https://usertourkit.com/blog/pitch-cto-open-source-onboarding)
