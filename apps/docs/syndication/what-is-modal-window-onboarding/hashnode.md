---
title: "What is a modal window? When to use modals in onboarding"
slug: "what-is-modal-window-onboarding"
canonical: https://usertourkit.com/blog/what-is-modal-window-onboarding
tags: react, javascript, web-development, accessibility
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-modal-window-onboarding)*

# What is a modal window? When to use modals in onboarding

A modal window is a UI element that sits on top of your app's main content and blocks interaction with everything behind it. Users have to deal with the modal (close it, fill it out, make a choice) before they can get back to what they were doing. That forced focus is both the modal's strength and its biggest risk.

If you're building onboarding flows in React, modals are one of several patterns you can reach for. Install User Tour Kit to get modal-compatible onboarding with built-in accessibility:

```bash
npm install @tourkit/core @tourkit/react
```

## Definition

A modal window (also called a modal dialog) is a child window that disables interaction with its parent window while remaining visible in the background. The term "modal" comes from "mode," meaning the interface enters a special state where only the dialog accepts input. As the [W3C WAI Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) puts it, "users cannot interact with content outside an active dialog window." Non-modal dialogs, by contrast, let users click freely between the dialog and the page behind it. The `<dialog>` element shipped in all major browsers by 2022 and has 96.8% global support as of April 2026 ([Can I Use](https://caniuse.com/dialog)).

## How modal windows work in HTML

Modern browsers ship a native `<dialog>` element that handles the hard parts of modal behavior automatically. Calling `showModal()` on a dialog element does three things at once: it opens the dialog with a `::backdrop` overlay, makes outside content inert so keyboard and screen reader users can't escape, and traps focus inside the dialog ([web.dev](https://web.dev/learn/html/dialog)).

Here's a minimal modal in React using the native element:

```tsx
// src/components/WelcomeModal.tsx
import { useRef, useEffect } from 'react'

export function WelcomeModal({ open, onClose }: {
  open: boolean
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="welcome-title">
      <h2 id="welcome-title">Welcome to the app</h2>
      <p>Take a quick tour or explore on your own.</p>
      <button onClick={onClose}>Start tour</button>
      <button onClick={onClose}>Skip</button>
    </dialog>
  )
}
```

Calling `showModal()` gives you focus trapping, Escape-to-close, and the `::backdrop` pseudo-element for styling the overlay. Calling `show()` instead opens a non-modal version with none of those behaviors. That distinction matters for onboarding: welcome screens need `showModal()`, while persistent help widgets work better as non-modal. Before the native `<dialog>` element, developers had to write roughly 50-100 lines of JavaScript for focus trapping and backdrop management alone.

## Modal examples in onboarding

Not every onboarding moment needs a modal. Here's when each pattern fits:

| Pattern | Blocks interaction | Best for | Example |
|---|---|---|---|
| Modal dialog | Yes | Critical choices, welcome screens | "Choose your workspace type" |
| Tooltip / popover | No | Contextual feature hints | "Click here to invite teammates" |
| Slideout panel | Partial | Multi-step forms, settings | Account setup wizard |
| Banner / toast | No | Non-critical announcements | "New: dark mode is here" |
| Checklist | No | Progressive task completion | "3 of 5 setup steps done" |

Slack does this well. Their onboarding modals introduce one feature at a time, stay visually cohesive, and always include a skip option. That last part matters. As [Appcues notes](https://www.appcues.com/blog/product-tours-ui-patterns), offering "Take the tour" alongside "Explore on my own" builds trust instead of trapping users.

The [Nielsen Norman Group](https://www.nngroup.com/articles/modal-nonmodal-dialog/) identifies five problems with modals: they demand immediate attention, interrupt workflows, cause context loss, increase interaction cost, and obscure background content. A 2023 Baymard Institute study found that 18% of users abandon checkout flows when hit with unexpected modals. Use modals when the tradeoff is worth it (critical decisions, destructive actions, focused onboarding steps). For everything else, prefer non-blocking patterns like tooltips and checklists.

## Why modals matter for onboarding accessibility

Modal accessibility goes wrong more often than it goes right. The W3C requires three things from a modal dialog: focus must move into the dialog on open, Tab must cycle within the dialog without escaping, and focus must return to the triggering element on close ([WAI APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)).

The ARIA attributes you need:

- `role="dialog"` (implicit on `<dialog>`)
- `aria-modal="true"` (implicit when using `showModal()`)
- `aria-labelledby` pointing to the dialog's visible heading

As of 2026, `aria-modal="true"` is the preferred approach over manually toggling `aria-hidden` on background content (ARIA 1.1 spec). But here's a gotcha: `aria-modal` only informs assistive technology. You still need actual focus trapping and inert background behavior in your code. The native `<dialog>` element with `showModal()` handles both, which is why it's the right starting point. According to [TPGi's 2024 audit](https://www.tpgi.com/the-current-state-of-modal-dialog-accessibility/), roughly 70% of custom modal implementations fail at least one WCAG 2.1 AA criterion.

## Modals in User Tour Kit

User Tour Kit treats modals as one pattern in a composable onboarding system across 10 packages totaling under 12KB gzipped. Instead of forcing every interaction into a modal, you pick the right pattern per step: modals for welcome screens, tooltips for feature discovery, checklists for progressive setup.

```tsx
// src/components/OnboardingFlow.tsx
import { TourProvider, useTour } from '@tourkit/react'

const steps = [
  {
    id: 'welcome',
    type: 'modal',
    content: 'Welcome! Choose your path below.',
  },
  {
    id: 'sidebar-hint',
    target: '#sidebar-nav',
    content: 'Your projects live here.',
  },
]
```

Tour Kit doesn't prescribe modal UI. You render your own `<dialog>` or Radix Dialog or shadcn/ui Dialog component, and Tour Kit manages the state, sequencing, and accessibility underneath.

One honest limitation: Tour Kit requires React 18+ and doesn't have a visual builder. If your team needs drag-and-drop modal creation without writing code, a SaaS tool like Appcues or Userpilot might fit better.

Explore the full component library and live examples at [usertourkit.com](https://usertourkit.com/).

## FAQ

### What is the difference between a modal and a non-modal dialog?

A modal dialog blocks interaction with the page behind it. Users must close or complete the modal before continuing. A non-modal (modeless) dialog lets users interact with both the dialog and the underlying page simultaneously. In HTML, `showModal()` creates a modal with backdrop and focus trapping, while `show()` opens a non-modal dialog without those behaviors.

### When should you avoid modals in onboarding?

Avoid modals for non-critical information like newsletter signups or promotional announcements. Don't interrupt users mid-task; if someone is filling a form, a popup breaks focus and triggers what NNGroup calls "visceral disdain." Prefer inline tooltips, banners, or checklists for feature discovery.

### What is modal fatigue and how do you prevent it?

Modal fatigue happens when users see so many dialogs that they dismiss them without reading. Prevent it by limiting modals to 1-2 per session, always including a visible close button, and using tooltips or checklists for lower-priority guidance.

### How do you make a modal accessible in React?

Start with the native `<dialog>` element and call `showModal()` to get built-in focus trapping, Escape-to-close, and `aria-modal="true"` for free. Add `aria-labelledby` pointing to your dialog's heading. Ensure focus returns to the triggering button on close.
