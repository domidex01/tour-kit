40% of product tour modals get dismissed on sight. That's from Chameleon's analysis of 15 million interactions.

But here's the thing — knowing the dismissal *rate* is different from knowing the dismissal *location*. Were users clicking the close button? Clicking outside the popover? Hitting ESC? Each carries a different signal about user intent.

I wrote a tutorial on building a Canvas-based heatmap overlay that tracks exactly where users click, dismiss, and complete each tour step. The implementation adds under 0.3KB to production and uses simpleheat (700 bytes) for rendering.

The most useful feature turned out to be step-level filtering. "Where did users click during step 2?" gives you completely different insights than looking at the whole tour at once.

Full tutorial with TypeScript code and benchmarks: https://usertourkit.com/blog/product-tour-heatmap

#react #typescript #productanalytics #ux #opensource
