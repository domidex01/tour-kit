## Title: How design tools handle feature discovery in complex UIs

## URL: https://usertourkit.com/blog/design-tool-onboarding-feature-discovery

## Comment to post immediately after:

I compared how Figma, Canva, Adobe XD, Sketch, and Penpot approach the same fundamental problem: hundreds of features in one screen, users who need to discover them gradually.

The interesting finding is that despite years of iteration, no major design platform combines all three things that matter: opt-in (not forced) short tours, context-sensitive progressive disclosure based on user behavior, and full WCAG 2.1 AA accessibility.

Figma's approach hasn't changed meaningfully since 2022. Canva's contextual triggering is the strongest model but leaves power features invisible. Sketch just... doesn't have in-app onboarding at all.

The article includes a comparison table of all five platforms, code examples for implementing behavior-triggered progressive disclosure in React, and notes on the WCAG 2.1.4 keyboard shortcut requirement that most tools ignore.

Data points: optimal tour length is 3-5 cards (based on ProductFruits analysis of successful SaaS onboarding), GitHub/Microsoft/DX found a 50% creative problem-solving uplift from intuitive tooling, and Figma charges $15/editor/month for a product where many users discover less than 20% of available features.
