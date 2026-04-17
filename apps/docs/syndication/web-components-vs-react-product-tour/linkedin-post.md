Should you build product tours with web components for framework portability?

I tried. The shadow DOM creates four specific problems for tours:

1. Overlay positioning breaks across shadow root boundaries
2. You can't apply your design system styles inside shadow DOM
3. Focus trapping for accessibility can't reach into shadow roots
4. Click analytics lose context when events cross shadow boundaries

After prototyping, I switched to React components for Tour Kit. The bundle math also works out: if your app already ships React, a React-based tour adds ~20KB. A Lit-based web component tour adds ~17KB of Lit on top of the React you're already loading.

Web components work beautifully for isolated leaf UI (GitHub, Salesforce, and Adobe all use them for design systems). But product tours are orchestration layers, not leaf components.

The pragmatic middle ground: framework-agnostic core logic + framework-specific rendering. Portability where it matters, without fighting browser APIs where it doesn't.

Full technical breakdown with benchmarks: https://usertourkit.com/blog/web-components-vs-react-product-tour

#react #javascript #webcomponents #webdevelopment #frontend #opensource
