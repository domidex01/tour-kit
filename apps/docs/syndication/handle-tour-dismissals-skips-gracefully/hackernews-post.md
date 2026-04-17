## Title: 70% of users skip product tours – patterns for handling dismissals gracefully

## URL: https://usertourkit.com/blog/handle-tour-dismissals-skips-gracefully

## Comment to post immediately after:

I've been building a headless product tour library for React and kept running into the same problem: everyone designs the tour itself, but almost nobody thinks about what happens when users dismiss it.

The data is interesting. Chameleon's 2025 benchmark puts the skip rate for traditional linear tours at ~70%. Three-step tours complete at 72%, seven-step tours at 16%. And the counter-intuitive finding: users forced through long tours churn at similar rates to users who skipped entirely.

I categorized dismissals into five types (explicit skip, Escape key, click-outside, navigation, timeout) and built different handling patterns for each. The three most useful:

1. Snooze pattern — "Remind me later" with step persistence, so users resume where they left off rather than restarting
2. Dismissal reason tracking — capturing "too long" vs "already know this" vs "bad timing" alongside the analytics event
3. Contextual re-engagement — watching for the user to encounter the feature the skipped step covered, then showing a single hint

The article has working TypeScript examples for each. Curious if others have found different approaches — especially around the a11y side (focus return after dismissal, screen reader announcements).
