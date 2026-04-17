## Title: Building a Canvas heatmap for product tour interactions (clicks, dismissals, completions)

## URL: https://usertourkit.com/blog/product-tour-heatmap

## Comment to post immediately after:

Wrote this after realizing funnel analytics for product tours answer "which step" but not "where on the screen." The 40% modal-dismissed-on-sight stat from Chameleon's 15M interaction study is well known, but nobody tracks the spatial distribution of those dismissals.

The implementation uses simpleheat (700 bytes, Canvas) for rendering and a plain TypeScript module for collection. Total production overhead is under 0.3KB — the visualization lazy-loads in a dev dashboard.

The most interesting finding was that dismissal method matters more than dismissal rate. Close-button clicks, outside clicks, and ESC presses carry fundamentally different user intent signals. Tracking them separately per tour step gives you actionable data instead of a single drop-off number.

Built with Tour Kit (my headless React tour library), but the collector pattern is library-agnostic. Any tour library with step lifecycle callbacks works.
