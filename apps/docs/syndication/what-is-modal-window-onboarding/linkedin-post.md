70% of custom modal implementations fail at least one accessibility criterion.

That stat from TPGi's 2024 audit stopped me mid-refactor. I was building onboarding modals for a React app and assumed custom was better. It isn't.

The native HTML `<dialog>` element with `showModal()` handles focus trapping, Escape-to-close, and screen reader semantics automatically. 96.8% browser support. Zero custom JavaScript needed for the hard parts.

But the bigger lesson was about when NOT to use modals at all. Nielsen Norman Group identifies five problems with them, and Baymard found 18% of users abandon flows when hit with unexpected ones.

For onboarding, the answer is usually: modals for welcome screens and critical choices, tooltips for feature hints, checklists for progressive setup. One pattern per purpose.

I wrote up the full breakdown with code examples and a comparison table:
https://usertourkit.com/blog/what-is-modal-window-onboarding

#react #accessibility #webdevelopment #ux #frontenddevelopment
