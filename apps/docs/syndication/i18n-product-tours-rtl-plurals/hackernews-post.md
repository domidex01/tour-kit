## Title: Internationalization in product tours: RTL tooltip positioning, ICU plurals, ARIA translation

## URL: https://usertourkit.com/blog/i18n-product-tours-rtl-plurals

## Comment to post immediately after:

I wrote this because I couldn't find a single article about internationalizing product tours specifically. General i18n guides exist by the hundreds, but they all skip the problems unique to sequential, positioned, timed onboarding content.

The three issues that surprised me most:

1. RTL tooltip arrows break because most libraries use physical CSS properties (`left: 12px`) instead of logical ones (`inset-inline-start: 12px`). Mozilla bug #1277207 documents this exact problem. CSS logical properties have full browser support in 2026, but most tour libraries haven't adopted them.

2. "Step 1 of 5" requires ICU MessageFormat if you support Arabic (6 plural categories), Polish (special rules for 2-4 vs 5-9), or dozens of other languages. String interpolation produces grammatically wrong output.

3. Nobody publishes the combined bundle cost of a tour library + i18n library. The delta is significant: Tour Kit (8KB) + next-intl (457B) = 8.5KB vs React Joyride (37KB) + react-i18next (22KB) = 59KB.

Honest caveat: I built Tour Kit, so there's inherent bias in the library comparisons. All bundle sizes are verifiable on bundlephobia.
