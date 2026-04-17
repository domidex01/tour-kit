## Title: Tour Kit + Sentry: Catching product tour errors before users report them

## URL: https://usertourkit.com/blog/tour-kit-sentry-error-tracking

## Comment to post immediately after:

Product tours interact with the DOM in ways that fail silently — querySelector returns null, positioning breaks, overlays render on elements that haven't mounted. Users don't report these failures; they just leave.

This is a walkthrough of wiring Tour Kit's lifecycle callbacks (onTourStart, onStepView, onTourComplete, onTourSkip) to Sentry breadcrumbs and error boundaries. About 60 lines of TypeScript. The key insight is using Sentry tags (component:product-tour, active_tour:{tourId}) to make tour errors filterable and alertable separately from the rest of your frontend errors.

Disclosure: I built Tour Kit, so take the integration framing with appropriate skepticism. The Sentry side of this is standard React error boundary + breadcrumb usage that applies to any component library, not just ours.

The trickiest part was handling the Suspense boundary case — tour targets inside lazy-loaded components can cause null reference errors that look completely unrelated to tours without the breadcrumb context.
