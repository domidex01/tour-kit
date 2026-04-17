Tooltips seem like a solved problem. They're not.

I installed 10 React tooltip libraries into the same project and tested them for bundle weight, WCAG 1.4.13 compliance, and developer experience.

Some findings:
→ Floating UI ships at ~3kB gzipped with 6.25M weekly downloads. It's the positioning engine behind Radix, Chakra, and half the ecosystem.
→ react-tooltip weighs 889KB unminified. Developers report they "don't use 80% of the features."
→ Tippy.js maintainers call it "legacy" and point to Floating UI for new projects.
→ The browser Popover API now handles show/hide, Escape dismissal, and light-dismiss natively with 0kB JavaScript.

The accessibility angle most teams miss: WCAG 1.4.13 requires tooltips to be dismissable, hoverable without vanishing, and persistent. Only 3 of the 10 options pass all three out of the box.

Full comparison with decision framework: https://usertourkit.com/blog/best-tooltip-libraries-react-2026

#react #javascript #webdevelopment #accessibility #opensource
