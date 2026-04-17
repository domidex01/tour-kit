## Title: What is user onboarding? A definition for developers, not product managers

## URL: https://usertourkit.com/blog/what-is-user-onboarding

## Comment to post immediately after:

I went looking for a developer-oriented definition of user onboarding and couldn't find one. Every result defines it for PMs and marketers: "guide users to their aha moment." Accurate but not useful when you need to decide where state lives, how to handle page refreshes, or whether your overlays trap focus correctly.

The article breaks onboarding into four technical concerns: state tracking, conditional rendering logic, overlay/positioning rendering, and measurement instrumentation. It includes a minimal React hook using useSyncExternalStore for persisting onboarding state.

The accessibility angle was the most surprising finding. Searching for "user onboarding WCAG" or "onboarding ARIA" returns essentially zero results. Yet onboarding tooltips are interactive dialogs that need focus management, keyboard navigation, and screen reader announcements per WCAG 2.1.

Data from Chameleon's analysis of 15M tour interactions: completion drops from 72% at 3 steps to 16% at 7 steps. Miller's working memory limit (5-7 items) explains why.
