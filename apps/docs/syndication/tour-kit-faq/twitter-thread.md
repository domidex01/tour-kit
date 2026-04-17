## Thread (6 tweets)

**1/** Before you install a React product tour library, here are the 20 questions every developer asks first.

I compiled answers with real data from npm, bundlephobia, and independent audits. A thread:

**2/** React 19 compatibility is broken in the most popular option.

React Joyride (400K+ weekly downloads) hasn't been updated in 9+ months and doesn't support React 19. Shepherd's React wrapper has issues too.

Check before you install.

**3/** Bundle sizes vary 100x across tour libraries:

- Driver.js: ~5KB gzipped
- Tour Kit: <8KB core
- Reactour: ~15KB
- React Joyride: 498KB unpacked

The fix regardless of library: lazy-load tours. Never ship them in your initial bundle.

**4/** Tailwind compatibility is the #1 integration complaint.

React Joyride uses inline styles with no class name support. Shepherd uses HTML strings instead of JSX. If you run Tailwind or shadcn/ui, you'll hit this on day one with most libraries.

**5/** Accessibility is a differentiator, not a default.

An audit found Intro.js missing aria-labelledby, using links as buttons, no focus trap. Shepherd does better. Most developers don't check this pre-install.

**6/** Full FAQ with comparison tables, TypeScript examples, and honest limitations:

https://usertourkit.com/blog/tour-kit-faq

(I built Tour Kit, so I'm biased. Disclosed throughout. Every number is sourced.)
