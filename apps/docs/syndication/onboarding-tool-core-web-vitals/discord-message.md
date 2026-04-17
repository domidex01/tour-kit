## Channel: #articles in Reactiflux

**Message:**

Wrote up a deep dive on how Appcues, Pendo, and UserGuiding affect Core Web Vitals (field data, not Lighthouse). The TL;DR: INP gets hit the hardest because these tools register event listeners and DOM observers that fire on every interaction, even on pages with no active tours. The compound effect across all three CWV is worse than any single metric suggests.

Includes a 20-minute measurement methodology if you want to test your own setup: https://usertourkit.com/blog/onboarding-tool-core-web-vitals

Curious if anyone has field CWV data from their own apps with these tools installed — would love to compare notes.
