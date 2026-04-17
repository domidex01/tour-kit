## Thread (6 tweets)

**1/** The W3C's own tooltip spec page says "this design pattern is work in progress; it does not yet have task force consensus."

Most tooltip tutorials skip this entirely. Here's what the spec actually requires in React:

**2/** WCAG 1.4.13 defines 3 rules for tooltip content:

- Dismissible (Escape key)
- Hoverable (mouse can move onto the tooltip)
- Persistent (stays until user removes hover/focus)

The hoverable one breaks almost every hand-rolled implementation.

**3/** Two patterns, not one:

- aria-describedby → for elements that already have a label ("Save" button + tooltip)
- aria-labelledby → for icon buttons with no visible text

Most tutorials only teach the first.

**4/** Two attributes you should NEVER use on tooltips:

- aria-expanded (tooltips aren't user-controlled)
- aria-haspopup (tooltips aren't in the popup list)

Also: `disabled` kills tooltips by removing focusability. Use `aria-disabled="true"` instead.

**5/** Touch devices have no hover. 60% of web traffic is mobile.

Tooltips are broken by design on mobile. The correct fallback is a toggletip (ⓘ icon with aria-expanded on tap).

**6/** Full deep-dive with TypeScript code, a comparison table (Radix, Floating UI, React Aria, react-tooltip), and the warmup/cooldown delay pattern:

https://usertourkit.com/blog/aria-tooltip-component-react
