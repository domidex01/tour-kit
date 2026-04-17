## Subreddit: r/reactjs

**Title:** I researched product tour dismissal rates and built patterns for handling skips gracefully — here's what the data says

**Body:**

I've been digging into tour dismissal data while building an onboarding library, and the numbers are pretty wild.

According to Chameleon's 2025 benchmark report, nearly 70% of users skip traditional linear tours. 78% abandon by step 3. Three-step tours complete at 72% while seven-step tours drop to 16%. The gap between user-triggered tours (~67% completion) and auto-triggered pop-ups (single-digit %) is enormous.

The most surprising finding: users forced through lengthy tours churn at similar rates to users who skipped entirely. So forcing completion doesn't actually help retention.

Based on this, I categorized dismissals into five types (explicit skip, Escape key, click-outside, navigation away, timeout) — each needs a different response. For example, click-outside is ambiguous (the user might just be exploring), while Escape is a clear WCAG-mandated exit.

Three patterns that worked well in practice:

1. **Snooze** — Give users "Remind me later" / "Show next time" / "Don't show again" instead of binary show/dismiss. Persist the current step so they resume where they stopped, not from the beginning.

2. **Dismissal reason tracking** — No major library tracks *why* users dismiss, just *that* they do. Capturing "too long" vs "already know this" vs "bad timing" is way more actionable than a generic skip count.

3. **Contextual re-engagement** — Instead of re-showing the whole tour, watch for the user to encounter the feature the skipped step covered, then show a single hint. User-triggered interactions get 2-3x higher engagement than auto-triggered ones.

On the a11y side: Escape must dismiss (WCAG operable), focus must return to the trigger element (not `document.body`), and screen readers need a live region announcement when the tour closes.

Full writeup with TypeScript/React code examples for each pattern: https://usertourkit.com/blog/handle-tour-dismissals-skips-gracefully

Happy to discuss any of these patterns — curious if others have found different approaches that work.
