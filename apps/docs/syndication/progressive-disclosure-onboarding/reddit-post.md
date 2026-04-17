## Subreddit: r/reactjs

**Title:** I researched progressive disclosure patterns for React onboarding — here's the three-layer framework that took completion from 53% to 75%

**Body:**

I spent the last few weeks digging into progressive disclosure as applied to product onboarding, and the data gap between linear tours and contextual disclosure is wild.

Chameleon's dataset of 15 million tour interactions shows linear product tours (the "here's 10 steps on first login" approach) average 53% completion. Progressive disclosure, where features are revealed based on user behavior rather than a schedule, hits 75%. That's not about better copy or prettier tooltips. It's structural.

The framework that works in practice has three layers:

1. **Orientation (first session)** — One guided action. Literally one step. A welcome modal that collects role/use case, then one tooltip pointing at the primary action. The restraint is the point.

2. **Contextual hints (first week)** — Hotspots and tooltips that appear when users navigate to new screens, gated by behavior signals (e.g., "show bulk actions only after the user creates 3+ items").

3. **Power user features (weeks 2+)** — Checklists and announcements for keyboard shortcuts, API access, and automation. Only shown to users who've hit usage thresholds.

The interesting part: NN/g research from Jakob Nielsen shows that more than 2 disclosure levels per interaction causes navigation confusion. Most 10-step onboarding tours violate this completely.

On the accessibility side, disclosure widgets have specific ARIA requirements (aria-expanded, aria-controls, Esc key dismissal per WCAG 2.1 1.4.13) that most onboarding implementations miss entirely.

I wrote up the full breakdown with React code examples, a metrics framework for measuring each layer, and SaaS examples from Airtable, Notion, ConvertKit, and Slack: https://usertourkit.com/blog/progressive-disclosure-onboarding

Disclosure: I build Tour Kit (a headless product tour library for React), so I used it for the code examples. The principles apply to any implementation.

Curious what patterns you've seen work for onboarding in your apps?
