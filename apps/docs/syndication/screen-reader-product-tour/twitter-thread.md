## Thread (7 tweets)

**1/** Most product tour libraries claim "WCAG compliant" but ship zero screen reader guidance.

I tested 5 libraries with NVDA, JAWS, and VoiceOver. Here's what actually works (and the 3 patterns every tour needs): 🧵

**2/** Problem 1: No announcement.

Tour step pops up visually but the screen reader stays silent. Fix: `aria-live="polite"` with a 100ms delay between container creation and content injection.

Without the delay, NVDA on Firefox silently drops the announcement. We tested this across 3 SRs.

**3/** Problem 2: Announcements are one-shot.

Sara Soueidan's research: "Once an announcement is made, it disappears forever. They cannot be reviewed, replayed, or revealed later."

If the user misses it, the step content is gone. That's why you need focus management, not just live regions.

**4/** Problem 3: Focus doesn't move.

Screen reader users can't Tab into a tour step they don't know exists. Fix: move focus into the step container + trap Tab within it + restore focus to the previous element on close.

The restore part is the detail everyone forgets.

**5/** Problem 4: Background escapes.

`aria-modal="true"` should suppress background content. JAWS respects it, NVDA partially ignores it, VoiceOver does its own thing.

The `inert` attribute is the modern fix. Baseline browser support since March 2023, consistent across all SRs.

**6/** The compliance angle:

WCAG SC 4.1.3 (Status Messages) directly governs tour step transitions. ADA Title II enforcement started April 2026. Lawsuits up 37% in 2025.

The screen reader software market hit $1.3B in 2024. This isn't niche.

**7/** Full tutorial with code examples, a comparison table across React Joyride / Shepherd / Driver.js / Intro.js / Tour Kit, and an 8-point manual testing checklist:

https://usertourkit.com/blog/screen-reader-product-tour

(I work on Tour Kit — bias disclosed, every claim is source-linked)
