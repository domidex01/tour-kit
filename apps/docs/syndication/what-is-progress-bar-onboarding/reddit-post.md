## Subreddit: r/reactjs

**Title:** The psychology behind progress bars in onboarding (and how to build accessible ones in React)

**Body:**

I was researching progress bar UX for an onboarding flow and found some interesting data. 78% of SaaS products now use progress indicators during setup (UserGuiding, 2026), and adding them increases completion rates by 20-30% (UserPilot). But the implementation details for developers are buried under product-manager-focused content.

A few things I found worth knowing:

- The Zeigarnik effect (incomplete tasks nag at your brain) is why seeing "3 of 5 done" creates pull to finish. The endowed progress effect means pre-filling the first step as "complete" actually boosts overall completion.
- Progress bars can *decrease* completion when early progress feels slow. A meta-analysis of 32 experiments found decelerating bars increased abandonment (Irrational Labs, 2025). Best approach: start the animation slow and accelerate toward the end.
- For accessibility, you need `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label`. For indeterminate bars, omit `aria-valuenow` entirely. Don't forget a live region to announce step transitions to screen readers.
- Nielsen's 10-second rule still holds: after 10 seconds without progress feedback, users assume things broke.

I wrote up the full breakdown with React code examples (minimal accessible implementation + a Tour Kit version with persistence): https://usertourkit.com/blog/what-is-progress-bar-onboarding

What patterns are you all using for onboarding progress in your apps? Curious if anyone's tried circular/radial indicators vs the standard linear bar.
