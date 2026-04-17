## Thread (6 tweets)

**1/** EUR 1.2 billion. That's what Meta paid for transferring EU user data to the US. Your onboarding tool sends the same kind of behavioral data to AWS us-east-1 by default. Here's what I found testing 8 self-hosted alternatives:

**2/** The market splits into two camps:
- Client-side JS libraries (data never leaves the browser)
- Docker platforms (data stays on your infra)

Client-side libraries are architecturally the strongest data sovereignty option. Zero data to transfer = zero compliance risk.

**3/** Surprise finding: Intro.js uses AGPL, which forces you to open-source your app. For EU companies where source disclosure conflicts with IP policies, that's a compliance burden on top of GDPR.

MIT-licensed alternatives: Tour Kit, Shepherd.js, Driver.js, React Joyride.

**4/** Accessibility is an afterthought across the board. Shepherd.js has keyboard nav and ARIA. Most others? Minimal at best. Tour Kit targets WCAG 2.1 AA. Nobody else claims it.

**5/** The "How to choose" framework:
- Need visual builder? Platform (Usertour, Shepherd Pro, Guidefox)
- Devs own onboarding + data sovereignty matters? Client-side library
- Multi-framework? Shepherd.js
- React + design system? Tour Kit

**6/** Full comparison with table, 8 detailed reviews, and decision framework:
https://usertourkit.com/blog/best-self-hosted-onboarding-tools

(Disclosure: I built Tour Kit. Tried to be fair — every claim is verifiable against npm/GitHub/bundlephobia.)
