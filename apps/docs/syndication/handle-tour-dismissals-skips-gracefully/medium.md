# How to handle tour dismissals and skips gracefully

## The exit experience matters more than the tour itself

*Originally published at [usertourkit.com](https://usertourkit.com/blog/handle-tour-dismissals-skips-gracefully)*

Most product tours fail. Not because the content is wrong, but because the exit experience is an afterthought. Nearly 70% of users skip traditional linear tours, and 78% abandon them by step three. The question isn't how to prevent skipping. It's what happens after.

A user who dismisses your tour and finds a helpful fallback is better off than a user who's forced through seven steps of content they already understand.

## Why dismissals matter more than completions

Tracking tour completion rates tells you what percentage of users finished. Tracking dismissals tells you *why they didn't*. And that second number is far more actionable.

Users who skip or abandon tours show 34% higher churn rates within 90 days compared to users who complete contextual onboarding. But here's the key finding: users forced through lengthy tours show similar churn to users who skipped entirely. Forced completion doesn't equal retention.

The numbers are striking. A 3-step tour completes at 72%. A 7-step tour drops to 16%. User-triggered tours hit ~67% completion while auto-triggered pop-ups barely reach single digits.

## The five dismissal types

Not all dismissals are equal. A user clicking "Skip tour" on step one has different intent than a user pressing Escape on step five.

**Explicit skip** — The user clicks "Not now." Store the skip, don't re-trigger immediately, offer a way back through a help menu.

**Escape key** — A WCAG accessibility requirement. Signals mild disinterest. The user might want the tour later.

**Click-outside** — Ambiguous. They might be exploring the product. Offer a "Resume tour" nudge after 30 seconds.

**Tab/navigation away** — A context switch, not a rejection. Persist the current step and resume when they return.

**Timeout/inactivity** — After 60+ seconds without interaction, auto-minimize the tour to a small beacon rather than leaving it blocking content.

## The snooze pattern

Every UX guide mentions "let users postpone" as a best practice, but none provide implementation details. The snooze pattern gives users three options instead of binary show/dismiss: continue, snooze (come back later), or dismiss (don't show again).

The critical detail: snooze persists the current step index. The user resumes where they stopped, not from the beginning. Restarting from step one after a user already reached step four is the fastest way to guarantee a permanent dismissal.

## Resume-from-where-you-left-off

76.3% of tooltips are dismissed within 3 seconds. Your tour needs to remember where the user stopped and resume there.

Three rules for resume behavior:

1. Expire stale progress. If a user dismissed 2 weeks ago, start fresh.
2. Validate the target element exists on the current page before resuming.
3. Show a brief "Picking up where you left off, step 4 of 6" message to orient the user.

## Tracking dismissal reasons

As of April 2026, no major product tour library tracks *why* users dismiss, only *that* they do. Capturing the reason (too long, already know this, bad timing) alongside the step reached and timestamp gives you the most actionable analytics data in your onboarding funnel.

Don't show the reason picker on every dismissal. That's its own kind of tour fatigue. Show it on the first dismissal and after every fifth.

## Accessibility requirements for dismissal

Tour dismissal is where most libraries fail WCAG 2.1 AA compliance. Three non-negotiable requirements:

The Escape key must always dismiss the tour. Focus must return to the trigger element, not `document.body`. And screen readers need a live region announcement confirming the tour closed and explaining how to restart it.

## Common mistakes

Showing the same tour on every page load after dismissal is hostile UX. Use a frequency cap of at least 72 hours.

Resetting progress on dismiss teaches users that dismissing equals losing progress, which makes them more likely to just close the app entirely.

48% of users who dismiss tours later look for the information those tours contained. Put a "Replay tour" button in your help menu. Users who self-initiate tours complete them at ~67%.

And if a user dismisses Tour A and Tour B is queued next, firing Tour B immediately feels like spam. Build in minimum gaps between tours.

---

Full article with working TypeScript code examples for each pattern: [usertourkit.com/blog/handle-tour-dismissals-skips-gracefully](https://usertourkit.com/blog/handle-tour-dismissals-skips-gracefully)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
