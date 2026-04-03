Most React tour libraries were built for React 16 and haven't caught up with React 19's component model.

I wrote a step-by-step tutorial on adding a product tour to a React 19 app. Two patterns stood out as significant improvements over how this was done before:

1. ref-as-prop eliminates forwardRef wrappers. In React 19, refs are regular props. Tour target elements no longer need wrapper components — you pass a ref directly. Most tour libraries (including React Joyride) still use forwardRef internally.

2. Async useTransition for multi-page tours. When a tour needs to navigate to a different route before showing the next step, React 18 forced developers to chain setState calls with useEffect watchers. React 19's useTransition accepts async functions, so you can await a route change and advance the tour in a single callback. The UI stays responsive during the transition.

The tutorial uses Tour Kit, a headless React product tour library I built (under 8KB gzipped for the core). "Headless" means it ships step sequencing, positioning, keyboard navigation, and accessibility — but your team renders the tooltips with whatever component library they're already using (shadcn/ui, Radix, Tailwind, custom design system).

The practical result: 5 minutes from npm install to a working 4-step tour. WCAG 2.1 AA accessible by default. Full TypeScript support.

For engineering managers evaluating onboarding tooling: the key decision is whether developers or product managers own tour creation. Code-based libraries like Tour Kit cost $0-99 one-time with full design system control. SaaS platforms like Appcues give PMs a visual builder at ~$249/month ($3K/year).

Tutorial: https://usertourkit.com/blog/add-product-tour-react-19

*Originally published at usertourkit.com*

#react #javascript #webdevelopment #typescript #opensource #productdevelopment
