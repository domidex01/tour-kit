## Title: Month 1 of an open source React library: 183 stars, 89 downloads, and what I'd cut

## URL: https://usertourkit.com/blog/tour-kit-launch-metrics-month-1

## Best posting time: Tuesday-Thursday, 8-10 AM EST

## Comment to post immediately after:

I built Tour Kit, a headless product tour library for React, as a solo developer. This is the month-1 retrospective with real numbers.

The short version: 183 GitHub stars, 89 npm weekly downloads, 487 docs visitors, 9 issues, 2 external PRs. Not a breakout. Not zero.

A few things I found interesting while writing this up:

1. npm download counts below ~50/day are essentially noise (mostly CI). The metrics that actually indicated adoption were qualitative: first issue from a stranger (day 4), first external PR (day 19), first unprompted mention (day 22).

2. Comparison articles drove more docs traffic than tutorials, even though 73% of developers say they want quickstart guides first. My theory: developers search for comparisons during evaluation, then read tutorials after choosing.

3. The hardest marketing problem for a headless library is demoing something invisible. The library's value is in hooks and composition patterns. Screenshots sell libraries, and I didn't have good visual demos ready on launch day.

I also made a mistake launching with 10 packages instead of 3. Building surveys, scheduling, and adoption tracking before anyone asked for them was building for a roadmap, not for users.

Happy to answer questions about the architecture decisions (core/react split, Turborepo monorepo, headless-first approach) or the content strategy.
