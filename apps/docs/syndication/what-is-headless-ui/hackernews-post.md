## Title: What is headless UI? The architecture pattern explained

## URL: https://usertourkit.com/blog/what-is-headless-ui

## Comment to post immediately after:

I wrote this because "headless UI" gets confused with headless CMS constantly, and most existing explainers skip the historical context entirely.

The pattern traces directly to Martin Fowler's Presentation Model (2004) and MVVM from WPF/Silverlight — same separation of concerns, just applied to React components via hooks. Juntao QIU's article on martinfowler.com makes this connection explicitly, but almost no blog post aimed at general React developers does.

Some numbers from the research: Radix UI has 9.1M weekly npm downloads as of late 2024. An engineer at Gloat documented spending 6 months migrating between traditional UI libraries (React-Bootstrap to Material-UI), then rebuilding the same component headlessly in about 2 hours. The time savings come from eliminating styling override fights.

The article covers three implementation approaches (hooks, compound components, render props), compares six libraries side by side, and acknowledges the real tradeoff — headless means writing more JSX, which isn't always faster for teams without existing design systems.

Happy to discuss the Radix vs React Aria vs Ariakit comparison — the accessibility depth differences between them are larger than I expected going in.
