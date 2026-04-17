## Title: Building onboarding in-house costs ~$70K/year — comparing 5 open-source alternatives

## URL: https://usertourkit.com/blog/best-alternatives-building-onboarding-in-house

## Comment to post immediately after:

I wrote this after seeing several teams at startups I know underestimate the true cost of building product tours from scratch. Appcues published data putting year-one cost at ~$70K ($45K build + $26K maintenance), and from my own experience that tracks.

The comparison covers Tour Kit (which I built, full disclosure), React Joyride, Shepherd.js, Driver.js, and Onborda. I tested all five in the same Vite 6 + React 19 + TS 5.7 project building identical 5-step tours.

The most interesting finding was around accessibility. WCAG 2.1 AA compliance is a legal requirement in more jurisdictions every year, yet almost no product tour library ships with complete focus trapping, keyboard navigation, and screen reader support out of the box.

Another thing that surprised me: the licensing landscape. Intro.js uses AGPL v3, which many legal teams reject outright for proprietary SaaS products. I limited the comparison to MIT-licensed alternatives.

The article breaks down the real cost of building in-house month by month and includes a decision framework for when each library (or building from scratch) actually makes sense.
