# Screen Reader Support in Product Tours: What Most Libraries Get Wrong

*A practical guide to making onboarding flows work with NVDA, JAWS, and VoiceOver*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/screen-reader-product-tour)*

---

Most product tour libraries list "WCAG compliant" as a feature. But when you actually test with a screen reader, the experience falls apart. Automated accessibility tools like axe-core and Lighthouse catch only 30–40% of real issues. The gap between "passes automated checks" and "works with NVDA" is where millions of users get stuck.

I spent several weeks testing product tour implementations across three major screen readers: NVDA (30.7% market share), JAWS (40.5%), and VoiceOver (10.1%). Here's what breaks and how to fix it.

## The three failure modes

Product tours rely on visual overlays — tooltip-style popups anchored to UI elements. Screen readers don't see visual positions. They navigate the DOM linearly. When a tour step pops up, three things go wrong:

**No announcement.** The step content appears visually but the screen reader never tells the user. Without an ARIA live region, there's silence.

**No focus movement.** Focus stays on whatever element the user was interacting with before the tour step appeared. They can't Tab into the step because they don't know it exists.

**No background suppression.** The screen reader's virtual cursor can navigate behind the tour overlay into content the user can't see. They end up lost in invisible background elements.

WCAG Success Criterion 4.1.3 requires step transitions to be programmatically announced. As of April 2026, ADA Title II enforcement is active and accessibility lawsuits increased 37% last year.

## Fix 1: ARIA live regions (with a timing trick)

The standard approach is creating a `role="status"` element with `aria-live="polite"`. But there's a critical implementation detail: you must insert the container into the DOM first, then populate it after a short delay.

Why? NVDA on Firefox — roughly 32% of screen reader browser combinations — silently drops announcements when the container and content appear in the same DOM mutation. A 100ms delay between creation and population fixes this.

Sara Soueidan's research confirms it: "Place the live region container in the DOM as early as possible and then populate it with the contents of the message."

But live regions have a catch. Once an announcement is made, it vanishes forever. A screen reader user who missed the announcement has no way to re-read the step content. This is why you need fix #2.

## Fix 2: Focus trapping per step

Move focus into the tour step when it opens. Trap Tab cycling within the step. Restore focus to the previous element when the step closes.

This makes step content persistently readable — the user can re-read the heading, description, and buttons at any time using normal screen reader navigation. It also prevents focus from escaping to background content.

The critical detail: store `document.activeElement` before activating the trap, then restore it on deactivation. Without this, closing the tour dumps the user at the top of the page.

## Fix 3: The `inert` attribute

`aria-modal="true"` is supposed to tell screen readers to ignore background content. In practice, JAWS respects it, NVDA partially ignores it in Firefox, and VoiceOver does its own thing.

The `inert` HTML attribute is the modern fix. Set it on your `<main>` element while the tour is active, and the entire background disappears from both the tab order and the accessibility tree. Consistent behavior across every modern browser since March 2023.

One caveat: your tour step must render outside `<main>` (in a portal) for this to work.

## The testing gap

A Lighthouse accessibility score of 100 tells you nothing about whether these patterns work. You need manual screen reader testing.

Start with NVDA on Firefox — it's the most literal reader and catches the most implementation errors. Test JAWS second (it applies heuristics that mask missing attributes). Check VoiceOver on Safari third.

Eight checks per step: announcement fires, focus moves in, Tab stays trapped, browse mode stays trapped, Escape closes, focus restores, step counter reads correctly, button labels are descriptive.

---

The full tutorial with working code examples, a comparison table across five libraries, and a complete troubleshooting guide is at [usertourkit.com/blog/screen-reader-product-tour](https://usertourkit.com/blog/screen-reader-product-tour).

*Submit to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium.*
