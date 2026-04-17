## Thread (6 tweets)

**1/** "Add a slideout" — one person calls it a drawer, another calls it a side panel. Turns out there's no agreed standard across design systems. I wrote up the definitive comparison.

**2/** Adobe calls it a "slideout." Material UI calls the same pattern a "drawer." PatternFly (Red Hat, 200+ enterprise products) also uses "drawer." Appcues and Userpilot use "slideout" for in-app messaging.

The functional difference? Intent, not animation.

**3/** The comparison table nobody makes:

Slideout = low interruption, contextual content
Modal = high interruption, destructive confirmations
Drawer = navigation and filters
Toast = auto-dismiss status messages

Each one needs a different ARIA role.

**4/** The a11y requirements most articles skip:

- Move focus into the panel on open
- Trap focus within it
- ESC closes the panel
- Return focus to trigger on close

Workflow slideouts: role="dialog"
Notification slideouts: role="complementary" + aria-live="polite"

**5/** The "alley" is underappreciated. Adobe's the only design system that names it: the visible strip of parent content next to a slideout. Clicking it dismisses the panel. It's what makes slideouts feel less aggressive than modals.

**6/** Full glossary entry with comparison table, code examples, and real-world examples from Miro, Appcues, and SEB Group:

https://usertourkit.com/blog/what-is-a-slideout
