## Title: Measuring onboarding tour impact on retention with Amplitude behavioral cohorts

## URL: https://usertourkit.com/blog/amplitude-tour-kit-onboarding-retention

## Comment to post immediately after:

I wrote this because most product tour analytics guides stop at completion rates. But completion is a vanity metric — it doesn't tell you whether the tour actually changes user behavior downstream.

The approach: instrument a React product tour with typed Amplitude events (about 70 lines of TypeScript), then create three behavioral cohorts — completers, skippers, and users who never saw the tour — and compare their Day-7/Day-30 retention curves. The third cohort is critical because it controls for selection bias.

Calm's team used this exact pattern and found 3x higher retention among users who completed a single onboarding step. They made that step mandatory and retention improved across the board.

The tutorial uses Tour Kit (a headless React tour library I'm building), but the Amplitude integration pattern — typed event schemas, Identify calls for cohort building, three-group retention analysis — works with any custom tour implementation.

Interesting finding from the research: Amplitude's deprecated react-amplitude library was never replaced with an official hooks-based package. There's no maintained typed React hook bridging product tour state to Amplitude events. This is a real gap in the React analytics ecosystem.
