## Subreddit: r/reactjs (primary), r/accessibility (secondary)

**Title:** I tested product tour screen reader support across 5 libraries — here's what actually works (and what doesn't)

**Body:**

I've been working on accessibility for product tours in React and found a gap: most tour libraries claim WCAG compliance but ship zero screen reader guidance. When I actually tested with NVDA and VoiceOver, the results were rough.

The core issue is three failure modes that automated tools (axe-core, Lighthouse) can't catch:

1. **No announcement** — step transitions happen visually but the screen reader stays silent. Needs `aria-live` regions with a specific timing trick (100ms delay between container creation and content injection, otherwise NVDA on Firefox drops it).

2. **No focus movement** — focus stays on the previous element. Screen reader users can't reach the tour step. The fix is a focus trap that also stores `document.activeElement` before activation so it can restore focus on close.

3. **No background suppression** — the virtual cursor can navigate behind the overlay. `aria-modal="true"` is supposed to handle this but support is inconsistent. The `inert` attribute on `<main>` is the correct modern approach (baseline browser support since March 2023).

Sara Soueidan's research on ARIA live regions was the most helpful resource I found — specifically her warning that live region announcements are transient and can never be replayed. That's what makes focus management critical rather than optional.

I also didn't know that WCAG SC 4.1.3 (Status Messages) specifically covers tour step transitions. Every step change is legally a "status message" under Level AA.

I wrote up the full implementation with code examples and a comparison table across React Joyride, Shepherd.js, Driver.js, Intro.js, and Tour Kit (which I work on — so take the comparison with skepticism): https://usertourkit.com/blog/screen-reader-product-tour

Curious if anyone else has done screen reader testing on their product tours. What screen reader/browser combos are you testing against?
