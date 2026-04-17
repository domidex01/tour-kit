## Thread (6 tweets)

**1/** 78% of SaaS products use progress bars in onboarding. But most dev content about them is written for product managers, not the people building them. Here's what I found researching the implementation side:

**2/** Progress bars boost onboarding completion by 20-30% (UserPilot). Five psychology principles at work: Zeigarnik effect, endowed progress, goal gradient, anchoring, and perceived control. The short version: incomplete tasks nag at your brain, and visible progress reduces anxiety.

**3/** But here's the catch — progress bars can DECREASE completion when early progress feels slow. A meta-analysis of 32 experiments found decelerating bars increased abandonment. Fix: start the animation slow and accelerate toward the end.

**4/** For accessibility, you need: role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax, and aria-label. For indeterminate bars, omit aria-valuenow entirely — its absence signals "unknown progress" to screen readers.

**5/** When to skip them: fewer than 3 steps, wildly different step durations, or branching paths. A linear bar that misrepresents a nonlinear flow erodes trust faster than showing no progress at all.

**6/** Full breakdown with React code examples, comparison table of 6 progress bar types, and FAQ: https://usertourkit.com/blog/what-is-progress-bar-onboarding
