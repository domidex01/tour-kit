## Thread (6 tweets)

**1/** Every headless UI article focuses on dropdowns and modals. But the pattern is arguably more valuable for product tours and onboarding flows. Here's why:

**2/** Your app has a design system with careful spacing, tokens, typography. Then your tour library injects its own tooltips that look like a different app. You spend 2 hours overriding CSS selectors. A headless tour library takes 15 minutes because you use your existing components.

**3/** The pattern evolved in three phases:
- HOCs (2015-2018): wrapper hell
- Render props (2018-2019): verbose but better
- Custom hooks (2019+): clean separation

A useTour() hook returns state + handlers. You write the tooltip JSX.

**4/** As of April 2026, headless component adoption grew 70% YoY. The five major headless React libraries have 73K+ combined GitHub stars. AI tools (v0, Cursor) standardized on shadcn/ui (built on Radix, a headless library). Tour libraries didn't keep up.

**5/** Simple heuristic: if your app has a design system, you need a headless tour library. The CSS override dance doesn't scale when you have design tokens. Your tour tooltips should be built with the same primitives as every other component.

**6/** Full guide with code examples, comparison table (bundle size, TypeScript, React 19, a11y), and library recommendations:

https://usertourkit.com/blog/what-is-headless-ui-guide-onboarding
