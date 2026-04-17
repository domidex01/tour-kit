## Thread (6 tweets)

**1/** TIL that `role="tooltip"` does absolutely nothing for screen readers.

The ARIA role is in the spec. Every tutorial tells you to add it. But `aria-describedby` and `aria-labelledby` do all the actual work.

Here's what else I found researching tooltip patterns:

**2/** The W3C's own tooltip pattern spec still lacks task force consensus as of April 2026.

We're all building production tooltips against an unfinished standard. That's... fine? I guess?

**3/** WCAG 1.4.13 requires three things from tooltips:

- Dismissable (Escape key)
- Hoverable (mouse can move onto tooltip)
- Persistent (stays until user acts)

Most custom implementations fail at least one.

**4/** 59% of web traffic is mobile.

Hover-only tooltips are invisible to the majority of users.

Your options: long-press, tap-to-toggle, or inline text on small screens. None are great.

**5/** There are four tooltip types most devs don't distinguish:

- Informational ("Export as CSV")
- Instructional ("Drag to reorder")
- Validation ("Password needs a number")
- Progress ("Step 3 of 5")

The last two belong in product tours, not standard UI hover labels.

**6/** Full breakdown with React code, a comparison table (tooltip vs popover vs toast), and how tooltips work inside product tours:

https://usertourkit.com/blog/what-is-a-tooltip
