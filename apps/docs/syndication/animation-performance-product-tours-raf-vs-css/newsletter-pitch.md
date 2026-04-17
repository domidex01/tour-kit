## Subject: Animation performance in product tours: rAF vs CSS (deep-dive with profiling data)

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a deep-dive on why product tour animations jank in production but not in demos. The core finding: implicit compositing at z-index 9999 can silently promote 14+ host-app elements to GPU layers, each costing ~307KB of memory (multiplied by 9 on mobile high-DPI screens).

The article covers the two-layer architecture (rAF for position calculation, CSS for visual transitions), a common antipattern where CSS variable updates per frame cause 8ms style recalcs on 1,300+ elements, and a practical decision tree for when to use CSS vs rAF vs the Web Animations API.

Link: https://usertourkit.com/blog/animation-performance-product-tours-raf-vs-css

Thanks,
Domi
