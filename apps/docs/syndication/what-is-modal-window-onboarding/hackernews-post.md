## Title: 70% of custom modal implementations fail WCAG 2.1 AA — the native dialog element fixes most of it

## URL: https://usertourkit.com/blog/what-is-modal-window-onboarding

## Comment to post immediately after:

I wrote this after building onboarding flows and realizing how many accessibility issues come from custom modal implementations. TPGi's 2024 audit found that roughly 70% of them fail at least one WCAG 2.1 AA criterion, mostly around focus management.

The native HTML `<dialog>` element with `showModal()` handles focus trapping, Escape-to-close, aria-modal, and backdrop rendering automatically. It has 96.8% global browser support now. Before it existed, you needed 50-100 lines of JavaScript just for the focus trap and backdrop.

The article also covers when modals are the wrong pattern for onboarding. NNGroup identifies five problems with modals, and Baymard found 18% of users abandon flows when hit with unexpected ones. Tooltips, checklists, and banners cover most use cases better.

I built User Tour Kit (a headless React onboarding library) which treats modals as just one pattern in a composable system. Happy to answer questions about the accessibility side or the native dialog element.
