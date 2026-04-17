The W3C's own tooltip spec still isn't finalized.

Their APG page says: "This design pattern is work in progress; it does not yet have task force consensus."

Yet 96.3% of websites have detectable WCAG failures (WebAIM Million, 2026), and missing ARIA attributes are the #2 category after low contrast text.

I wrote a deep-dive on what the tooltip spec actually requires in React — including the WCAG 1.4.13 hover persistence rule that most implementations miss, the aria-describedby vs. aria-labelledby split, and why disabled buttons silently break tooltip accessibility.

Key takeaway: if your tooltip content disappears when the user moves their mouse from the trigger to the tooltip itself, you're failing Level AA compliance.

Full article with TypeScript code and a library comparison table:
https://usertourkit.com/blog/aria-tooltip-component-react

#react #accessibility #webdevelopment #typescript #wcag
