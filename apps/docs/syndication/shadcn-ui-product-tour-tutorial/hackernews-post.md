## Title: Building accessible product tours with shadcn/ui components

## URL: https://usertourkit.com/blog/shadcn-ui-product-tour-tutorial

## Comment to post immediately after:

shadcn/ui is the most popular React UI library by GitHub stars (75K+) but has no product tour primitive. Radix UI discussion #1199 has been open since 2022 requesting one — a team member noted the accessibility challenge of isolating portions of the rendered page.

This tutorial shows how to build a 5-step product tour using shadcn/ui Card, Button, Badge, and Progress components with Tour Kit's headless hooks. The headless approach means the tour tooltip is a regular React component using your existing design system. No CSS overrides, no style conflicts.

The part I found most interesting to write was the section on why raw Radix Popover doesn't work for multi-step tours. Focus management between steps (closing one Popover, opening another at a different target) drops focus to the body element, which breaks screen reader context. Tour Kit handles cross-step focus management and WCAG 2.1 AA keyboard navigation in the core.

Comparison table in the article covers Tour Kit (~6KB), raw Radix Popover approach (~3KB but 2-4 hours of custom code), React Joyride (~37KB), and the shadcn-tour community component (~4KB).

Honest limitation: no visual builder. Steps are defined in TypeScript. If your team needs no-code, this isn't the right fit.
