## Subreddit: r/reactjs

**Title:** The WAI-ARIA tooltip spec still isn't finalized — I wrote up everything I learned building one correctly

**Body:**

I spent the last week going deep on the WAI-ARIA tooltip spec for a project and was surprised by how much most tooltip tutorials get wrong. A few things that stood out:

The W3C APG page for tooltips explicitly says "this design pattern is work in progress; it does not yet have task force consensus." So we're all implementing against an unfinished spec. The core attributes (`role="tooltip"` + `aria-describedby`) are stable in WAI-ARIA 1.2, but the behavioral guidance is still evolving.

WCAG 1.4.13 requires three things for tooltip content: it must be dismissible (Escape), hoverable (mouse can move onto the tooltip without it closing), and persistent. The hoverable part is what almost every hand-rolled implementation misses. If your tooltip vanishes when the mouse leaves the trigger, you're failing Level AA.

Two other gotchas that burned me:
- `aria-expanded` and `aria-haspopup` are both wrong on tooltips. Tooltips appear automatically, they're not user-controlled popups.
- The `disabled` attribute kills tooltips because it removes the button from the tab order. Use `aria-disabled="true"` instead.

I also found TkDodo's argument that tooltip components shouldn't exist as standalone primitives pretty compelling. His point about AI assistants amplifying anti-patterns is worth reading.

Full write-up with TypeScript code examples and a library comparison table (Radix, Floating UI, React Aria, react-tooltip): https://usertourkit.com/blog/aria-tooltip-component-react

Curious if others have run into the WCAG 1.4.13 hover persistence issue in production. How did you solve it?
