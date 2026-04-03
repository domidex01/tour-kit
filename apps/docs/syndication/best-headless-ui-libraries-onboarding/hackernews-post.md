## Title: Headless UI libraries for onboarding: a comparison of 7 options

## URL: https://usertourkit.com/blog/best-headless-ui-libraries-onboarding

## Comment to post immediately after:

I built a headless product tour library (userTourKit) and wanted to map the landscape. The phrase "headless onboarding library" returns almost nothing useful — the category barely exists.

After testing 7 libraries in a React 19 project, the space breaks into two groups: purpose-built onboarding tools (userTourKit, OnboardJS) and headless UI primitive libraries (Radix, React Aria, Base UI, Ark UI, Headless UI) whose popovers and dialogs become tour building blocks.

The surprising finding was the React 19 compatibility situation. React Joyride has ~400K weekly npm downloads but no stable React 19 support. Its class component architecture is fundamentally incompatible. One developer (Sandro Roth) wrote up evaluating every existing library and ultimately building a custom solution with XState + Floating UI.

Headless component adoption grew 70% in 2025 for general UI (Radix, React Aria, etc.), but nobody has applied those composition patterns to onboarding specifically. That's the gap.

Disclosure: userTourKit is my project, listed at #1 in the article. I've tried to be fair with the evaluation — every data point is verifiable against npm and GitHub.
