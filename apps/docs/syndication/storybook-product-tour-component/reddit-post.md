## Subreddit: r/reactjs

**Title:** How I document and test product tour components in Storybook (with play functions for multi-step flows)

**Body:**

I've been working on a headless product tour library for React and ran into a recurring problem: testing tour components in the actual app is painful. You need the right page, the right user state, and the right sequence to even see the tooltip render. Every edge case means more manual setup.

Moving tour components into Storybook solved most of this. Three things that surprised me:

- **Play functions for sequential flows.** I hadn't seen anyone script a multi-step tour flow (step 1 -> step 2 -> step 3) with assertions at each transition. Generic examples only cover form submissions. For tours, you need to verify tooltip repositioning, spotlight movement, and focus shifting at each step.

- **The a11y addon catches tour-specific issues fast.** Missing `role="dialog"` on the tooltip container, no `aria-label` on the spotlight overlay, focus not returning after tour completion. The axe-core engine flags these immediately instead of waiting for a Lighthouse audit. It catches up to 57% of WCAG issues automatically.

- **Autodocs + headless architecture.** Since Tour Kit separates logic (core package, under 8KB gzipped) from rendering (react package, under 12KB gzipped), Storybook's MDX pages let you document both the headless hook API and the styled wrapper side by side on the same page.

One thing I found funny: Storybook 7.1 shipped its own in-app guided tour to onboard new users. They literally built a product tour component to explain Storybook. Yet nobody has written about documenting YOUR tour components IN Storybook.

Full article with working TypeScript examples and a comparison table of Storybook features for tour components: https://usertourkit.com/blog/storybook-product-tour-component
