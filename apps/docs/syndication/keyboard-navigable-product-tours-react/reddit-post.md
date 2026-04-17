## Subreddit: r/reactjs

**Title:** I wrote up the keyboard accessibility gotchas we hit building product tours in React

**Body:**

I've been building Tour Kit, a headless product tour library for React, and spent a lot of time getting keyboard navigation right. Figured I'd share the gotchas since most tour libraries (and tutorials) skip this entirely.

Three things that tripped us up:

1. **Focus trapping in tooltips** — Without it, Tab escapes the tour card and lands on invisible page elements behind the overlay. We use a focus trap that cycles between the first and last focusable elements in the tooltip, with Shift+Tab wrapping backward.

2. **Arrow keys in form fields** — If a tour step highlights a form input and the user types, arrow keys should move the cursor, not navigate the tour. We check `document.activeElement` before handling keystrokes and skip navigation when the user is in an input or textarea.

3. **Focus restoration** — When the tour ends, focus needs to go back to wherever it was before the tour started. Otherwise keyboard users land on `<body>` and have to Tab through the entire page again.

The WCAG criteria that matter here are 2.1.1 (Keyboard), 2.1.2 (No Keyboard Trap), 2.4.3 (Focus Order), and 4.1.3 (Status Messages). We tested against axe-core 4.10 and VoiceOver with zero violations.

Full writeup with TypeScript code for each pattern: https://usertourkit.com/blog/keyboard-navigable-product-tours-react

(Disclosure: I built Tour Kit, so take the library recommendations with appropriate skepticism. The keyboard patterns themselves are framework-agnostic.)
