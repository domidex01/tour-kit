*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-a-hotspot-onboarding)*

# What is a hotspot in UX? The guidance pattern users actually click

*The opt-in alternative to modals and forced product tours*

You added a feature your users asked for. A month later, support tickets say nobody can find it. A modal would interrupt everyone. A tooltip only appears on hover, which is invisible on mobile. What you need is a hotspot.

## The definition

In onboarding UX, a hotspot is a small pulsing visual indicator placed on a UI element to draw attention without blocking the user's workflow. Unlike modals or guided tours, hotspots are opt-in: the user clicks or taps the beacon to reveal guidance content, and ignores it otherwise.

UserGuiding defines it as "a UX/UI pattern that aims to draw a website/app user's attention to a specific area or spot on the screen." Every major onboarding platform ships hotspots as a core pattern.

Quick distinction: "beacon" and "hotspot" get used interchangeably, but the beacon is the animated dot. The hotspot is the full pattern — beacon plus the tooltip it reveals.

## How they work

Three parts: a trigger (the pulsing beacon), content (a tooltip with 1–2 sentences), and a lifecycle that tracks dismissal state.

The tooltip must follow WCAG 2.1 SC 1.4.13: dismissible via Escape, hoverable without disappearing, persistent until closed. Sarah Higley, a Microsoft accessibility engineer, puts it directly: "do not use a timeout to hide the tooltip."

The lifecycle is a state machine: Idle (beacon pulsing) → Active (user clicked, tooltip open) → Dismissed (persisted to storage) → Retired (engagement threshold hit, removed permanently).

## When to use hotspots vs tooltips vs modals

The choice comes down to urgency:

**Hotspots** — zero cognitive load until clicked. Best for feature discovery. Work on mobile (tap-friendly). Content: 1–2 sentences + CTA.

**Tooltips** — appear on hover or focus. Best for label clarification. Poor on mobile (no hover on touch). Content: 1 sentence max.

**Modals** — block the entire page. Best for critical announcements only. Content: paragraphs, media, forms.

UX Myths research found less than 20% of page copy gets read. Opt-in patterns like hotspots outperform text-heavy onboarding because they let the user choose when to engage.

## Real-world examples

Five patterns from production apps:

1. SendGrid places hotspots on new dashboard elements for feature discovery.
2. Typeform uses beacons during first-run to introduce the form builder.
3. Plandisc adds pulsing indicators for new features, auto-retiring after 30 days.
4. Cuepath positions hotspots near checkout CTAs with 44x44px touch targets.
5. Krispy Kreme links hotspots to supplementary help content.

Whatfix reports in-context enablement makes end users 82% more confident navigating new features.

## Three rules for using hotspots well

**Cap density at 2–3 per view.** More creates visual noise. Queue the rest and reveal progressively.

**Persist dismissals.** If a user closes a hotspot, don't show it again. Store state in localStorage or your backend.

**Respect prefers-reduced-motion.** Swap the pulsing animation for a static indicator for users who've opted out of motion.

## The bottom line

Hotspots sit in the sweet spot between "invisible help" and "intrusive modal." They solve the feature adoption problem — you build it, users don't notice it — without creating the friction that kills onboarding completion rates.

The full article with code examples and a comparison table is at [usertourkit.com/blog/what-is-a-hotspot-onboarding](https://usertourkit.com/blog/what-is-a-hotspot-onboarding).

*Suggested Medium publications: JavaScript in Plain English, Bits and Pieces, UX Collective*
