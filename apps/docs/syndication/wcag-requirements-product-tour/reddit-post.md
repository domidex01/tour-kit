## Subreddit: r/reactjs (cross-post to r/accessibility)

**Title:** I mapped all 16 WCAG criteria that apply to product tours — here's what most libraries miss

**Body:**

I've been working on accessibility for product tour components and realized there's no single resource that maps WCAG 2.1 AA success criteria specifically to the lifecycle of a product tour (step sequencing, spotlight overlays, progress indicators, skip behavior, focus restoration).

So I wrote one. The short version:

Product tours trigger at least 16 WCAG success criteria. The three that most libraries fail:

1. **Focus doesn't move into the tour step when it opens** (violates SC 2.4.3). Keyboard users have no idea the tour started.
2. **No focus trap while the step is active** (violates SC 2.1.2). Tab key reaches background content behind the overlay.
3. **No screen reader announcement on step change** (violates SC 4.1.3). Screen reader users don't know the tour advanced.

A related data point that surprised me: in 2024, 722 of 3,188 ADA lawsuits targeted sites that already had an accessibility overlay widget installed (EcomBack report). Having a widget didn't prevent the lawsuit.

The minimum viable accessible tour step needs: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus-on-open, Escape-to-dismiss, and either focus movement or `aria-live` for step transitions.

Full article with a 16-criteria mapping table, library comparison, and code examples: https://usertourkit.com/blog/wcag-requirements-product-tour

Happy to discuss any of the criteria mappings — some of them (like where focus should go when a user dismisses mid-tour) don't have clear consensus.
