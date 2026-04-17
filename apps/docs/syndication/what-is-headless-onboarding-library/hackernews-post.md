## Title: What is a headless onboarding library?

## URL: https://usertourkit.com/blog/what-is-headless-onboarding-library

## Comment to post immediately after:

I couldn't find a clear definition of "headless onboarding library" anywhere, so I wrote one up.

The concept follows the same pattern as Radix UI or React Aria: the library manages behavior (step sequencing, focus trapping, keyboard nav, ARIA attributes) while you supply all the visual components. Applied to product tours and onboarding flows specifically.

The practical numbers: styled tour libraries like React Joyride ship at 37KB gzipped with their own CSS. Headless alternatives target under 8KB because they ship no styles, no theme tokens, no pre-built components. On mobile, that's a meaningful difference during first-run onboarding where page load directly impacts activation rates.

I built one of the libraries mentioned (Tour Kit), so factor that into how you read the comparison. Tried to be fair about the trade-offs: headless takes 30-60 min to set up vs 5-15 min for styled, and if you don't have a design system, the extra setup time may not be worth it.

Note: Definitional content may not be the best HN fit. Consider bundling with a more substantial technical post or saving for a Show HN launch.
