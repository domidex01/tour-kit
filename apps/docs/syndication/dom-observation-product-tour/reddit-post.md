## Subreddit: r/reactjs (primary), r/webdev (secondary)

**Title:** I mapped which browser observer API solves which product tour positioning problem — here's what I found

**Body:**

I've been working on a product tour library and kept running into the same positioning bugs: tooltips breaking when sidebars collapse, targets not existing yet when the tour starts, steps showing for elements scrolled out of view. Turns out each of these is a different observer API's job, and most articles just list the APIs without connecting them to real use cases.

Here's the short version:

- **ResizeObserver** fires before paint, after layout. It's the one you need for tooltip repositioning when your target changes size. But it requires manual `disconnect()` or it leaks ~8 KB per observation cycle. A study of 500 repos found 787 instances of missing disconnects.
- **MutationObserver** handles DOM tree changes — when your tour target appears/disappears from async rendering. Unlike the other two, it's garbage collected automatically. Jake Archibald (Chrome team) confirmed this asymmetry.
- **IntersectionObserver** checks visibility — should I show this step or is the target out of view? Also needs manual disconnect.

The interesting finding: there's no native `PositionObserver` API. The W3C has nothing in the spec. That's why Floating UI runs 4 strategies simultaneously (ResizeObserver + IntersectionObserver + scroll + resize events) to approximate position tracking.

Also learned that Sentry's product tour uses zero observer APIs — they went CSS-only with z-index layering and react-popper. Works for static targets but breaks the moment your DOM isn't predictable.

Full breakdown with code examples and a comparison table: https://usertourkit.com/blog/dom-observation-product-tour

Happy to answer questions about the observer patterns or the cleanup strategies.
