CSS cascade layers (@layer) have had 96% browser support since March 2022.

Only 2.71% of production websites actually use them.

I wrote a guide on a specific use case: fixing specificity conflicts when you add product tour or onboarding UI to an existing React app. The three failure modes (z-index stacking context traps, specificity arms races, non-deterministic source order from code-splitting) all trace back to the same root cause — CSS was never designed for third-party components to coexist predictably.

@layer fixes this by making layer position the priority mechanism instead of selector weight. One declaration at the top of your entry CSS, and every conflict resolves predictably.

The most interesting finding: Shadow DOM is actively harmful for overlay UI like tooltips and tour steps. It blocks focus management, keyboard event bubbling, and screen reader accessibility tree traversal. CSS layers give you the priority control without breaking any of that.

Full guide with Tailwind integration patterns and code examples: https://usertourkit.com/blog/css-layers-product-tour-styles

#css #react #webdevelopment #frontend #tailwindcss

