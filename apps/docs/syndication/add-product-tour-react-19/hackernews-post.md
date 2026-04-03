## Title: Adding a product tour to a React 19 app with ref-as-prop and async useTransition

## URL: https://usertourkit.com/blog/add-product-tour-react-19

## Comment to post immediately after:

This is a tutorial covering how to build a 4-step product tour in a React 19 app using Tour Kit, a headless tour library I built (under 8KB gzipped core).

The technically interesting parts:

React 19 dropped the `forwardRef` requirement, so tour target elements can receive refs as regular props. This eliminates the wrapper component layer that libraries like React Joyride still require internally.

The async `useTransition` pattern is the bigger win. Multi-page tours need to navigate to a different route before showing the next step. In React 18 this meant chaining `setState` with timeouts or `useEffect` watchers. React 19's `useTransition` accepts async functions, so you can `await router.push('/settings')` then call `next()` in a single callback. The UI stays responsive during the transition.

Sentry's engineering team wrote about this exact problem when building their product tours — step text separated from the focused element made conditional logic painful. Tour Kit co-locates step content with step config to avoid that.

The library is headless (no prescribed UI), so it works with whatever component library you're using. WCAG 2.1 AA accessibility is built in: focus trapping, aria-live announcements, prefers-reduced-motion support.

Full disclosure: I built Tour Kit. The tutorial should be useful for anyone implementing tours in React 19 regardless of the library they choose.

**Best posting time:** Tuesday–Thursday, 8–10 AM EST
