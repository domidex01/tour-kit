## Title: What is a slideout? Comparing modals, drawers, toasts, and slideouts with ARIA roles

## URL: https://usertourkit.com/blog/what-is-a-slideout

## Comment to post immediately after:

I kept hitting the same terminology confusion in code reviews and design specs. "Slideout," "drawer," "side panel," and "sliding pane" are used interchangeably across design systems with no agreed standard.

Adobe's pattern library calls it a "slideout" and documents a specific anatomy (the visible strip of parent content is called the "alley"). Material UI and PatternFly both use "drawer" for the same visual pattern. In the in-app messaging space (Appcues, Userpilot), "slideout" means a non-intrusive notification panel.

The article maps the terminology across design systems, includes a comparison table with the correct ARIA roles for each variant (slideout, modal, drawer, toast), and covers accessibility requirements per Knowbility's research.

One thing I found interesting: Adobe documents support for nesting up to two slideout panels, each indenting progressively. Almost nobody else covers this pattern.
