shadcn/ui has 75,000+ GitHub stars and no product tour component.

Radix UI's team acknowledged why in an open discussion from 2022: building an accessible tour pattern that "isolates portions of the rendered page" is an unsolved problem in component library design.

Most teams hack tours together with Popover + a backdrop div, or pull in a library like React Joyride (~37KB) that fights their existing design system with inline styles.

I wrote a tutorial on a different approach: building product tours using your existing shadcn/ui Card, Button, and Badge components with Tour Kit's headless hooks. The tour tooltip inherits your CSS variables automatically. Dark mode, custom themes, and design token changes just work.

The article covers:
- Complete tooltip code with shadcn/ui primitives
- Why raw Radix Popover breaks for multi-step tours
- WCAG 2.1 AA accessibility (the thing every other tutorial skips)
- Comparison: Tour Kit (~6KB) vs Joyride (~37KB) vs DIY Popover

Full tutorial: https://usertourkit.com/blog/shadcn-ui-product-tour-tutorial

#react #shadcnui #webdevelopment #accessibility #opensource
