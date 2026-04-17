Astro now has 900k weekly npm downloads and Cloudflare acquired the team in January 2026. More product teams are building with it.

I wrote a tutorial on adding product tours to Astro sites using React islands. The key insight: product tours are a textbook "island" use case. Interactive overlays on static content, loaded only where needed.

The non-obvious challenge is that React Context can't span island boundaries. Each client:only component creates an independent React root. The solution is Nanostores (under 1KB) for shared state between islands.

Bundle impact: under 20KB gzipped for the full tour setup, and pages without the tour load zero tour-related JavaScript.

Full walkthrough with code examples, accessibility patterns, and multi-page tour support: https://usertourkit.com/blog/astro-react-product-tour

#react #astro #javascript #webdevelopment #productdevelopment #opensource
