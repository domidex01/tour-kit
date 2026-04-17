## Title: Documenting and testing product tour components in Storybook

## URL: https://usertourkit.com/blog/storybook-product-tour-component

## Comment to post immediately after:

I've been building a headless product tour library for React (Tour Kit) and moved all component development into Storybook. The article covers three specific integration points that aren't documented anywhere else:

1. Using play functions to test multi-step tour flows with assertions at each step transition. Most play function examples cover forms and buttons, but sequential tours need verification that the tooltip repositioned, the spotlight moved, and focus shifted correctly between steps.

2. The a11y addon catching tour-specific WCAG issues (missing role="dialog", no aria-label on spotlight overlays, broken focus return) on every story render via axe-core.

3. MDX Doc Blocks for documenting both headless hooks and styled components side by side, since Tour Kit ships logic and rendering as separate packages.

An ironic detail: Storybook 7.1 shipped its own in-app guided tour for onboarding new users, yet no one has written about building tour component documentation inside Storybook.
