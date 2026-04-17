Product tour animations that work in development and break in production. Sound familiar?

I spent time profiling why this happens. The root cause is a browser behavior called implicit compositing: a tooltip animated at z-index 9999 silently forces every higher-stacked element in the host app onto its own GPU layer. In a production dashboard, this can mean 14+ unwanted layer promotions, each costing ~307KB of GPU memory.

The fix isn't choosing between CSS and requestAnimationFrame. It's using both as a pipeline: rAF computes positions, CSS applies them on the compositor thread.

Wrote up the full findings including a CSS variable antipattern that costs 8ms/frame on large DOMs, a decision tree for when to use CSS vs rAF vs the Web Animations API, and prefers-reduced-motion guidance specific to tour UI patterns.

https://usertourkit.com/blog/animation-performance-product-tours-raf-vs-css

#react #javascript #webperformance #animation #frontend
