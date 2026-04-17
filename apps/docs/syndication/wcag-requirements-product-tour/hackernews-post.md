## Title: The 16 WCAG 2.1 AA criteria that apply to product tours

## URL: https://usertourkit.com/blog/wcag-requirements-product-tour

## Comment to post immediately after:

I mapped every WCAG 2.1 AA success criterion to specific product tour components — the modal dialogs, tooltips, and overlays that make up onboarding flows.

Most articles about WCAG cover generic modals or tooltips, but product tours have a unique lifecycle: step sequencing, spotlight overlays, progress indicators, "skip tour" buttons, and the question of where focus should go when someone dismisses mid-flow. None of that is covered well anywhere.

Key findings: 94.8% of home pages had WCAG failures in 2025 (WebAIM Million Report). Product tours add another layer of interactive content on top of that baseline. The three most common failures are focus not moving into tour steps, no focus trap within steps, and no screen reader announcement on step transitions.

An interesting data point: 722 of 3,188 ADA lawsuits in 2024 targeted sites that already had accessibility overlay widgets installed. The overlay injection pattern that many tour libraries use creates the same class of problems.
