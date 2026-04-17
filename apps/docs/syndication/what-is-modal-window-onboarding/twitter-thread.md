## Thread (6 tweets)

**1/** 70% of custom modal implementations fail at least one WCAG 2.1 AA criterion (TPGi, 2024).

The native HTML `<dialog>` element fixes most of these issues for free. Here's what I learned building onboarding modals in React: 🧵

**2/** `showModal()` gives you:
- Focus trapping
- Escape-to-close
- `::backdrop` overlay
- `aria-modal="true"`

All automatic. Before `<dialog>`, that was 50-100 lines of custom JS.

Browser support: 96.8% globally.

**3/** But modals aren't always the right pattern for onboarding.

NNGroup identifies 5 problems: forced attention, workflow interruption, context loss, interaction cost, obscured content.

18% of users abandon checkout flows when hit with unexpected modals (Baymard, 2023).

**4/** When to use what:

✅ Modal → welcome screens, critical choices
✅ Tooltip → contextual feature hints
✅ Checklist → progressive task completion
✅ Banner → non-critical announcements

One pattern per purpose. Not everything needs a modal.

**5/** The biggest a11y gotcha:

`aria-modal="true"` only tells screen readers the dialog is modal. It doesn't actually trap focus or make background content inert.

You still need real focus management. The native `<dialog>` handles this. Custom implementations usually don't.

**6/** I wrote the full breakdown with React/TypeScript code examples, a comparison table, and the W3C accessibility requirements:

https://usertourkit.com/blog/what-is-modal-window-onboarding

Built with @usertourkit — a headless React library where modals are one pattern in a composable onboarding system.
