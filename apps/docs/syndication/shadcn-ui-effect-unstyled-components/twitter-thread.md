## Thread (7 tweets)

**1/** shadcn/ui hit 104K GitHub stars and 560K weekly npm downloads. But the real story isn't the numbers — it's what it proved about how developers want to build UI.

The unstyled component model won. Here's what that means for your stack: 🧵

**2/** Three forces killed the old "install a styled library" model:

- Design systems diverged (every team has its own tokens now)
- React Server Components broke CSS-in-JS at runtime
- AI tools can't edit code inside node_modules

**3/** The headless ecosystem is now massive:

- Radix UI: 9.1M weekly npm downloads
- React Aria: 50+ components, 30+ languages
- Base UI 1.0: 35 components (shipped Feb 2026)
- Ark UI: React, Solid, Vue, Svelte

Combined: 14M+ weekly installs.

**4/** Supabase switched their auth UI to shadcn/ui's copy-paste model.

Why? Their npm-based approach created "an endless customization wishlist and maintenance burden."

Code ownership > dependency management.

**5/** This applies beyond buttons and dialogs. Product tour libraries like React Joyride (37KB) and Shepherd.js (28KB) ship opinionated styles that fight your design system.

The fix: separate behavior (hard) from presentation (yours).

**6/** The tradeoff is real: unstyled = more upfront work. No visual builder, no pre-styled components out of the box.

But styled library overrides compound every sprint. Headless costs are front-loaded then linear.

**7/** Full writeup with code examples, comparison table, and practical framework for evaluating headless vs styled:

https://usertourkit.com/blog/shadcn-ui-effect-unstyled-components
