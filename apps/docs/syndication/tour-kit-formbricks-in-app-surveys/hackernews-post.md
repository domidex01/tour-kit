## Title: Triggering in-app surveys after product tour completion with Formbricks and Tour Kit (React)

## URL: https://usertourkit.com/blog/tour-kit-formbricks-in-app-surveys

## Comment to post immediately after:

We wanted to collect CES (Customer Effort Score) feedback right after users complete onboarding tours. The tricky part isn't the survey itself — it's the timing and the glue between two independent libraries.

Tour Kit fires an `onComplete` callback when a tour finishes. That callback calls `formbricks.track()` with an action name. Formbricks's SDK checks locally whether any survey matches that action and shows it. About 40 lines of TypeScript total.

The interesting findings from testing:
- A 2-second delay between tour completion and survey display got noticeably higher response rates than 0s or 5s
- Chameleon's benchmark data (15M interactions) shows ~27% of users dismiss tours early — collecting feedback from that group with a separate 1-question survey was more valuable than the CES survey
- The Formbricks SDK is async, so you need to handle the case where it hasn't finished loading when the tour ends

Both Tour Kit and Formbricks are open source. The whole stack is $0/month if you self-host Formbricks (AGPLv3, Docker). I built Tour Kit; Formbricks is independent.
