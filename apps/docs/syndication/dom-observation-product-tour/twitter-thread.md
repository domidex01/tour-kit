## Thread (6 tweets)

**1/** There's no browser API that tells you "this element moved on screen."

No PositionObserver. No ClientRectObserver. The W3C spec has nothing.

So how do product tour tooltips track their targets? Three observer APIs, each solving a different problem:

**2/** ResizeObserver fires BEFORE paint, after layout.

Perfect for tooltip repositioning — you get new dimensions in time to move the tooltip in the same frame.

But forget to disconnect() and you leak ~8 KB per cycle. A study of 500 repos found 787 missing disconnects.

**3/** MutationObserver handles DOM tree changes — elements appearing/disappearing.

The surprise: unlike ResizeObserver, MutationObserver is garbage collected automatically. No manual disconnect needed for memory safety.

Jake Archibald (Chrome team) confirmed this asymmetry.

**4/** IntersectionObserver checks visibility — is the tour target in view?

v2 adds trackVisibility: true to detect elements hidden behind modals. Tradeoff: minimum 100ms callback delay.

**5/** Floating UI combines all three + scroll/resize listeners for ~1ms position updates.

Sentry took the opposite approach: zero observers, CSS-only positioning.

Both work. The choice depends on whether your DOM is static or dynamic.

**6/** Full breakdown with React hooks, cleanup patterns, and a comparison table:

https://usertourkit.com/blog/dom-observation-product-tour

Covers ResizeObserver loop errors, the MutationObserver firehose problem, and when CSS-first beats observer-first.
