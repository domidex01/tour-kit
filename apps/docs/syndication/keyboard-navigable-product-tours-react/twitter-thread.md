## Thread (6 tweets)

**1/** 95.9% of homepages have detectable WCAG failures. Missing keyboard support is in the top 5.

Most React product tour libraries? They ignore keyboard users entirely. No focus trapping, no arrow keys, no screen reader announcements.

Here's how to fix that.

**2/** First problem: focus escaping the tooltip.

Without a focus trap, Tab sends keyboard users to invisible elements behind the overlay. Tour Kit's useFocusTrap cycles Tab between first and last focusable elements in the tooltip. Shift+Tab wraps backward.

**3/** Second: arrow keys fighting with form fields.

If a tour step highlights an input and the user types, ArrowRight should move the cursor — not skip to the next step. Check document.activeElement before handling keystrokes.

**4/** Third: focus restoration.

When the tour ends, focus needs to go back to where it was. Otherwise keyboard users land on <body> and Tab through the entire page again. Store activeElement on tour start, restore it on end.

**5/** The WCAG criteria that matter:
- 2.1.1 (Keyboard) — all interactions work from keyboard
- 2.1.2 (No Keyboard Trap) — Escape always exits
- 2.4.3 (Focus Order) — logical tab sequence
- 4.1.3 (Status Messages) — aria-live step announcements

Tested with axe-core 4.10 + VoiceOver. Zero violations.

**6/** Full tutorial with TypeScript code for each pattern:

https://usertourkit.com/blog/keyboard-navigable-product-tours-react

Built with Tour Kit (<8KB gzipped, MIT license). The keyboard patterns themselves are framework-agnostic.
