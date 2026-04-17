# What is a modal window? A developer's guide to using modals in onboarding

### When blocking the UI is the right call, and when it isn't

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-modal-window-onboarding)*

A modal window is a UI element that sits on top of your app's main content and blocks interaction with everything behind it. Users have to deal with the modal (close it, fill it out, make a choice) before they can get back to what they were doing.

That forced focus is both the modal's strength and its biggest risk.

## The definition

A modal window (also called a modal dialog) is a child window that disables interaction with its parent window while remaining visible in the background. The term "modal" comes from "mode" — the interface enters a special state where only the dialog accepts input.

The W3C WAI Authoring Practices Guide puts it simply: "users cannot interact with content outside an active dialog window." Non-modal dialogs, by contrast, let users click freely between the dialog and the page behind it.

The native HTML `<dialog>` element has 96.8% global browser support as of April 2026. Calling `showModal()` gives you focus trapping, Escape-to-close, and a `::backdrop` overlay automatically. Before this native element, developers had to write roughly 50–100 lines of JavaScript just for focus trapping and backdrop management.

## When to use modals in onboarding (and when not to)

Not every onboarding moment needs a modal.

**Use modals for:** critical choices (workspace type selection), welcome screens, destructive action confirmations, focused onboarding steps requiring user input.

**Skip modals for:** non-critical announcements (use banners), contextual feature hints (use tooltips), progressive task completion (use checklists), anything that interrupts a user mid-task.

Slack does this well. Their onboarding modals introduce one feature at a time, stay visually cohesive, and always include a skip option.

The Nielsen Norman Group identifies five problems with modals: they demand immediate attention, interrupt workflows, cause context loss, increase interaction cost, and obscure background content. A 2023 Baymard Institute study found that 18% of users abandon checkout flows when hit with unexpected modals.

## The accessibility gotcha

Modal accessibility goes wrong more often than it goes right. According to TPGi's 2024 audit, roughly 70% of custom modal implementations fail at least one WCAG 2.1 AA criterion.

The W3C requires three things from a modal dialog:

1. Focus must move into the dialog on open
2. Tab must cycle within the dialog without escaping
3. Focus must return to the triggering element on close

The native `<dialog>` element with `showModal()` handles all three. That's why it's the right starting point over custom implementations.

One common mistake: `aria-modal="true"` only informs assistive technology. You still need actual focus trapping and inert background behavior in your code.

## A composable approach

User Tour Kit treats modals as one pattern in a composable onboarding system across 10 packages totaling under 12KB gzipped. Instead of forcing every interaction into a modal, you pick the right pattern per step.

Tour Kit doesn't prescribe modal UI. You render your own dialog component, and Tour Kit manages the state, sequencing, and accessibility underneath. That headless approach means your onboarding modals match the rest of your design system.

One honest limitation: Tour Kit requires React 18+ and doesn't have a visual builder. If your team needs drag-and-drop modal creation without writing code, a SaaS tool might fit better.

Full article with code examples: [usertourkit.com/blog/what-is-modal-window-onboarding](https://usertourkit.com/blog/what-is-modal-window-onboarding)

---

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
