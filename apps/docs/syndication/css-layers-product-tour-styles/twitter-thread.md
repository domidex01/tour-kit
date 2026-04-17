## Thread (6 tweets)

**1/** CSS @layer has had 96% browser support for 4 years.

Only 2.71% of production websites actually use it.

Here's how it fixes the specificity mess when you add third-party UI components (tooltips, overlays, modals) to an existing app:

**2/** The problem: you portal a tooltip into an app using Bootstrap/MUI/Tailwind.

Three things break:
- z-index stacking context traps
- Specificity arms race (Bootstrap tooltip z-index: 1,070)
- Source order changes between deploys from code-splitting

Everyone reaches for !important.

**3/** @layer replaces specificity with layer position:

```
@layer reset, third-party, host-app, tour-kit, utilities;
```

A single class in a higher layer beats `#app .card .tooltip.active` in a lower one.

No !important anywhere.

**4/** The best part: CSS outside any @layer block automatically wins over ALL layered styles.

Use this for overlay lockout — styles that must render on top unconditionally. Zero !important, the cascade does the work.

**5/** Shadow DOM keeps coming up as "the answer" for style isolation.

It's the wrong answer for tooltips/overlays:
- Breaks element.focus() across boundaries
- Stops keyboard event bubbling
- Disrupts aria-describedby references

@layer gives priority control without breaking accessibility.

**6/** Full guide with Tailwind integration patterns, code examples, and a Shadow DOM comparison table:

https://usertourkit.com/blog/css-layers-product-tour-styles

The 2.71% adoption stat tells me this is an education problem, not a browser problem.
