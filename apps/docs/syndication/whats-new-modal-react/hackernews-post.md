## Title: Building a "What's New" changelog modal in React with native dialog and localStorage

## URL: https://tourkit.dev/blog/whats-new-modal-react

## Comment to post immediately after:

Step-by-step tutorial covering a changelog modal implementation in React using the native `<dialog>` element instead of library modals.

The native `<dialog>` handles focus trapping and ESC-key dismissal without additional JavaScript. react-modal still ships at 188KB (per Bundlephobia, April 2026) while `<dialog>` has 97%+ browser support. The tutorial uses localStorage for seen/unseen tracking with stable entry IDs, plus lifecycle callbacks for analytics.

The implementation uses Tour Kit's announcements package (I'm the author). The interesting architectural choice was separating display logic (what to show, when, how often) from rendering (your JSX). The provider manages frequency rules (once, session, N-times, interval-based) while the component just reads from a hook.

Smashing Magazine published a useful modal vs. separate page UX decision tree in March 2026 that informed some of the design choices: https://www.smashingmagazine.com/2026/03/modal-separate-page-ux-decision-tree/
