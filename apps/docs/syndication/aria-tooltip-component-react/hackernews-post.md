## Title: The WAI-ARIA tooltip pattern is still "work in progress" – here's what the spec actually requires

## URL: https://usertourkit.com/blog/aria-tooltip-component-react

## Comment to post immediately after:

I went deep on the WAI-ARIA tooltip spec recently and found a few things that surprised me.

First, the W3C APG tooltip pattern page carries an explicit caveat: "This design pattern is work in progress; it does not yet have task force consensus." The core attributes (role="tooltip" + aria-describedby) are stable in WAI-ARIA 1.2, but the behavioral guidance is still evolving.

Second, WCAG 1.4.13 (Content on Hover or Focus) requires three things that most implementations miss: the tooltip must be dismissible (Escape key), hoverable (mouse can move from the trigger onto the tooltip without it closing), and persistent. The hover persistence requirement alone breaks most hand-rolled tooltips.

Third, there's a genuine tension between "should this be a standalone component" (flexibility) and "should tooltip behavior be embedded in higher-level components" (safety). TkDodo makes a strong case for the latter, especially when AI code generation amplifies whatever patterns already exist in a codebase.

The article includes working TypeScript examples, a comparison of how Radix UI, Floating UI, and React Aria handle these requirements differently, and coverage of the disabled button trap and touch device limitations.
