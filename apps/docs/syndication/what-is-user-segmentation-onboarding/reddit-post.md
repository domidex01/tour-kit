## Subreddit: r/reactjs

**Title:** How do you handle showing different product tours to different user segments?

**Body:**

I've been working on segment-based onboarding in React and wanted to share what I've learned about user segmentation for product tours.

The short version: user segmentation means grouping users by shared characteristics (role, behavior, experience level, plan tier) and showing each group a different tour. Your admin doesn't need the same walkthrough as a first-time free-trial user.

There are six main types of segmentation for tours — demographic, behavioral, psychographic, experience level, journey stage, and firmographic (B2B). The data backs it up: SocialPilot reported 20% higher activation and 15% less churn after implementing segmented onboarding. Formbricks found personalized paths increase completion rates by about 35%.

In React, it boils down to conditional rendering. A function maps user data to a segment, and each segment loads a different tour config. If you're using a headless tour library, the logic lives in your codebase — version-controlled, testable, and deployed with your app. No vendor dashboard needed.

One angle that doesn't get talked about enough: segmentation and accessibility. W3C WAI guidelines actually recommend personalization that accounts for cognitive and motor needs. Segments that respect `prefers-reduced-motion` or adjust tour density for cognitive load are both better UX and closer to where WCAG 3.0 is heading.

I wrote up the full breakdown with a React code example and a comparison table of the six segmentation types: https://usertourkit.com/blog/what-is-user-segmentation-onboarding

Curious how others here handle segment-based tours. Do you roll your own logic, use feature flags, or lean on a no-code tool?
