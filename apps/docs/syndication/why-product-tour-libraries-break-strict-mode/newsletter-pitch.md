## Subject: Why most product tour libraries break in React Strict Mode

## Recipients:
- Cooperpress (React Status, JavaScript Weekly): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site

## Email body:

Hi [name],

I wrote a deep-dive on why React's Strict Mode mount-unmount-remount cycle breaks most product tour libraries — covering the 7 specific patterns that fail, an unresolved React ref bug (#24670) that causes silent listener leaks even with proper cleanup, and a 5-point audit checklist developers can run in 2 minutes.

Tested React Joyride, Shepherd.js, Driver.js, and Intro.js. Includes real-world data from Atlassian's atlaskit onboarding spotlights breaking after their React 18 upgrade. No existing tour library roundup tests for Strict Mode compliance, so this fills a content gap.

Link: https://usertourkit.com/blog/why-product-tour-libraries-break-strict-mode

Thanks,
Domi
