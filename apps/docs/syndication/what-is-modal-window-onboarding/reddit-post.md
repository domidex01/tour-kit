## Subreddit: r/reactjs

**Title:** TIL the native HTML dialog element handles most modal accessibility for free — here's what I found while building onboarding flows

**Body:**

I've been working on onboarding modals in a React app and went down a rabbit hole on modal accessibility. Turns out the native `<dialog>` element with `showModal()` gives you focus trapping, Escape-to-close, `aria-modal="true"`, and a `::backdrop` overlay out of the box. Before `<dialog>`, that was easily 50-100 lines of custom JavaScript.

The sobering stat: TPGi's 2024 audit found that roughly 70% of custom modal implementations fail at least one WCAG 2.1 AA criterion. Most of those failures are focus management issues that the native element just handles.

For onboarding specifically, the key insight from NNGroup is that modals have five distinct problems (forced attention, workflow interruption, context loss, interaction cost, obscured content). Modals make sense for welcome screens and critical choices, but tooltips and checklists are better for feature discovery. Baymard Institute found 18% of users abandon checkout flows when hit with unexpected modals.

I wrote up the full breakdown with code examples (React + TypeScript) and a comparison table of when to use modals vs tooltips vs checklists vs banners in onboarding: https://usertourkit.com/blog/what-is-modal-window-onboarding

Curious if others have moved to native `<dialog>` or are still using Radix/HeadlessUI for modals?
