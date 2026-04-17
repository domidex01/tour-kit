## Title: Web components vs React components for product tours – shadow DOM trade-offs

## URL: https://usertourkit.com/blog/web-components-vs-react-product-tour

## Comment to post immediately after:

I maintain Tour Kit, a headless product tour library for React. When I started the project, the framework-agnostic promise of web components was appealing — build once, use in React, Vue, Angular.

After prototyping the overlay engine as a custom element, I ran into four shadow DOM problems that made the approach impractical for product tours specifically: overlay z-index isolation across shadow roots, inability to pierce styles (no Tailwind inside shadow DOM without a separate build), focus trapping that can't querySelectorAll into shadow roots, and event retargeting that breaks analytics.

The pragmatic solution: framework-agnostic core logic (pure TypeScript) with framework-specific rendering adapters. That gives you portability at the logic level without fighting shadow DOM at the rendering level. Companies like GitHub and Salesforce use web components for leaf UI, and that's where they shine — but orchestration-heavy UI like product tours needs a richer component model.

Measured init time: Tour Kit (React) at 3.2ms vs a Lit-based equivalent at 4.8ms on a 2023 MacBook Air. Not a huge gap, but web components don't win on performance either.

Happy to answer questions about the architectural trade-offs.
