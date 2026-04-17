## Subreddit: r/reactjs

**Title:** Wrote up an explainer on the headless UI pattern — the architecture behind Radix, React Aria, and shadcn/ui

**Body:**

I kept running into the same confusion when newer devs asked "what is headless UI?" — most explanations either conflate it with headless CMS or jump straight into library recommendations without explaining the pattern itself.

So I wrote a glossary-style breakdown covering: where the pattern came from (Martin Fowler's Presentation Model, MVVM), the three implementation approaches (hooks, compound components, render props), and how the major libraries compare side by side.

Some data points that surprised me during research: Radix UI now pulls 9.1M weekly npm downloads. An engineer at Gloat documented spending 6 months migrating between styled libraries, then refactoring the same component to headless in about 2 hours. And 73% of businesses reportedly use some form of headless architecture as of 2026.

The tradeoff section is honest — headless means writing more JSX, and teams without a design system may find it slower initially.

Full article with code examples and a comparison table of 6 headless React libraries: https://usertourkit.com/blog/what-is-headless-ui

Curious if anyone has strong opinions on Radix vs React Aria vs Ariakit — I found the accessibility depth varies more than I expected.
