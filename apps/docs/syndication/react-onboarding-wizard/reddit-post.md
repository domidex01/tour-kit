## Subreddit: r/reactjs

**Title:** I checked the top 5 React stepper tutorials — none of them handle focus management or ARIA roles. Here's what's missing.

**Body:**

I was building an onboarding wizard for a project and went through the most popular React stepper tutorials to see how they handle accessibility. The result was pretty disappointing.

Out of five tutorials (including posts from CSS-Tricks, Smashing Magazine, and LogRocket), zero implement `aria-current="step"` on the active step indicator. Zero manage focus when steps change. That means when a user clicks "Continue," the browser focus stays on the now-hidden button. Screen reader users hear nothing, keyboard users are lost.

The fix is surprisingly simple: `tabIndex={-1}` on the step content container + a `useEffect` that calls `.focus()` on step change + `aria-live="polite"` for screen reader announcements. Three attributes and a hook.

I also put together a comparison of bundle sizes across approaches: Stepperize is impressively tiny at <1KB, MUI Stepper pulls in ~80KB+ through the MUI dependency, and custom implementations land around 0.5-2KB depending on how much you build.

I wrote up the full tutorial with working code examples, a comparison table, and common gotchas (like why `aria-live` needs to be on the persistent container, not the step component): https://usertourkit.com/blog/react-onboarding-wizard

Note: I built Tour Kit (the library used in the tutorial), so take the comparison with appropriate skepticism. Every number is verifiable on bundlephobia/npm.

Curious if anyone else has found good patterns for accessible multi-step forms. What's your approach?
