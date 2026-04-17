*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-tool-best-free-tier)*

# Which Onboarding Tool Has the Best Free Tier? (2026 Comparison)

"Free" shows up on every onboarding tool's pricing page, but the meaning varies wildly. We tested free plans across 10 SaaS onboarding tools and 8 open-source libraries to find which ones are genuinely free and which are just trials.

## Key findings

**Only 6 SaaS tools have free-forever plans.** Product Fruits leads at 5,000 MAU, followed by Userflow (1,000), Chameleon (1,000, 10 experiences), CommandBar (1,000), Pendo (500), and UserGuiding (100). Appcues, Userpilot, WalkMe, and Whatfix offer only trials or enterprise pricing.

**The free-to-paid jump is steep.** Chameleon goes from $0 to $249/month at 1,001 MAU. Pendo jumps from free to $15,000+/year for enterprise features.

**Accessibility is universally ignored.** We reviewed 15 existing comparison articles and none evaluate WCAG compliance. Shepherd.js is the only established open-source library that documents accessibility support. Tour Kit ships WCAG 2.1 AA compliance in its MIT-licensed free tier.

## Decision framework

- **React teams wanting design control:** Open-source headless libraries (Tour Kit, React Joyride) with no MAU limits
- **Non-technical teams under 5,000 MAU:** Product Fruits (strongest SaaS free tier)
- **Need analytics at under 500 MAU:** Pendo Free (but plan your exit strategy)
- **Accessibility required:** Shepherd.js or Tour Kit

## Open-source comparison

| Library | License | Stars | Key strength |
|---------|---------|-------|-------------|
| React Joyride | MIT | 7,600 | Zero license restrictions |
| Driver.js | MIT | -- | Lightweight, zero dependencies |
| Tour Kit | MIT | -- | Headless, WCAG 2.1 AA, TypeScript-first |
| Shepherd.js | AGPL | 13,000 | Accessibility, 170+ releases |
| Intro.js | AGPL | 12,000 | 12+ year track record |

Full comparison with detailed pricing table: [usertourkit.com/blog/onboarding-tool-best-free-tier](https://usertourkit.com/blog/onboarding-tool-best-free-tier)

**Disclosure:** The author built Tour Kit. All data points are verifiable against public pricing pages, npm, and GitHub.
