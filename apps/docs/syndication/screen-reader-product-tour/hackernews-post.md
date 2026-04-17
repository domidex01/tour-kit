## Title: Screen reader support in product tours – ARIA live regions, focus traps, and the inert attribute

## URL: https://usertourkit.com/blog/screen-reader-product-tour

## Comment to post immediately after:

I've been working on accessibility patterns for product tours in React and found a surprising gap: no product tour library has published dedicated screen reader implementation guidance.

The main issue is three failure modes that automated tools like axe-core can't detect (automated tools catch only 30-40% of accessibility issues according to TestParty's research):

1. ARIA live region announcements require a specific timing pattern — the container must exist in the DOM before content is injected. NVDA on Firefox drops announcements when both happen in the same DOM mutation. A 100ms delay fixes it.

2. Live region announcements are transient — Sara Soueidan's research confirms they vanish permanently after being read. If a user misses the announcement, they can't re-read the step. Focus management (moving focus into the step container) makes the content persistently accessible.

3. `aria-modal="true"` has inconsistent support across NVDA, JAWS, and VoiceOver. The `inert` HTML attribute is the modern correct pattern for suppressing background content during modal-style overlays.

WCAG SC 4.1.3 (Status Messages, Level AA) directly governs tour step transitions but no library documentation mentions it. With ADA Title II enforcement starting April 2026, this has compliance implications.

I work on Tour Kit (headless React tour library), so the article uses Tour Kit's implementation as examples. The patterns are transferable to any library though — the core techniques are framework-agnostic.
