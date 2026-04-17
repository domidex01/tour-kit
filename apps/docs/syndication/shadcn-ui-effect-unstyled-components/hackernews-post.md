## Title: The shadcn/ui effect: why unstyled components win

## URL: https://usertourkit.com/blog/shadcn-ui-effect-unstyled-components

## Comment to post immediately after:

I wrote this after looking at the headless/unstyled component ecosystem's growth numbers for 2026. The data tells a clear story: Radix UI pulls 9.1M weekly npm downloads, React Aria ships 50+ components, Base UI 1.0 launched in February with 35 components, and Ark UI covers four frameworks. Combined that's 14M+ weekly installs for headless primitives alone.

Three forces drove the shift: design system divergence made styled library overrides painful, React Server Components broke runtime CSS-in-JS, and AI coding tools work much better with transparent source code than node_modules abstractions.

What I found most interesting is Supabase's decision to switch their auth UI from npm packages to shadcn's copy-paste model. Their stated reason: npm-based component distribution created "an endless customization wishlist and maintenance burden."

I have skin in the game here — I build Tour Kit, a headless product tour library — so the article discloses that. But the trend extends well beyond any single project. The "behavior as dependency, presentation as owned code" architecture is becoming the default for React UI at every layer.

Happy to answer questions about any of the data or arguments.
