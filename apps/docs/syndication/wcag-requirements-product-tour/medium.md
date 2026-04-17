# Your Product Tour Probably Fails 3+ Accessibility Requirements

## A developer's guide to the 16 WCAG criteria that apply to onboarding overlays

*Originally published at [usertourkit.com](https://usertourkit.com/blog/wcag-requirements-product-tour)*

Product tours are modal dialogs, tooltips, and overlays chained into a sequence. Each component in that chain carries specific WCAG 2.1 AA obligations — and most tour libraries fail at least three of them.

In 2024, 3,188 ADA website lawsuits were filed in the US alone. 722 of those targeted websites that already had an accessibility overlay installed. Having a widget didn't prevent the lawsuit.

Here's what you need to know: product tours must meet at least 16 WCAG success criteria. The most critical ones involve focus management, screen reader announcements, and keyboard navigation.

**The biggest failure: focus management.** When a tour step opens, keyboard focus must move into it. When it closes, focus returns to the trigger. Between steps, focus stays trapped inside the active step. Most libraries get this wrong.

**The overlay trap.** 72% of users with disabilities rated accessibility overlay widgets as ineffective. Tour libraries that inject pre-styled DOM nodes use the same pattern. The alternative: headless tour libraries that let you render steps with your own accessible components.

**The deadline.** The DOJ's April 24, 2026 deadline mandates WCAG 2.1 AA for US government sites. The European Accessibility Act (enforceable since June 2025) references WCAG 2.2 AA.

The full article includes a 16-criteria mapping table, comparison of how popular tour libraries handle each criterion, a decision framework for choosing the right approach, and working code examples.

[Read the full breakdown at usertourkit.com](https://usertourkit.com/blog/wcag-requirements-product-tour)

*Submit to: JavaScript in Plain English, Better Programming, or UX Collective*
