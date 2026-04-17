## Thread (6 tweets)

**1/** Every i18n guide covers translating your app. None cover translating your onboarding.

75% of internet users speak a non-English language. Your product tour is the first thing they interact with.

I wrote the guide that doesn't exist yet 🧵

**2/** RTL tooltip positioning breaks silently.

`placement: "right"` puts the tooltip ON TOP of the target in Arabic layouts.

Fix: CSS logical properties (`inset-inline-start` instead of `left`). Full browser support since 2023, but most tour libraries still use physical properties.

**3/** "Step 1 of 5" is wrong in most languages.

Arabic has 6 plural categories (including dual form for 2).
Polish has special rules for numbers ending in 2-4.

You need ICU MessageFormat, not string interpolation.

**4/** Nobody publishes combined bundle sizes for tour + i18n:

Tour Kit + next-intl = ~8.5 KB
Tour Kit + LinguiJS = ~18.4 KB
React Joyride + react-i18next = ~59 KB
Shepherd.js + react-i18next = ~67 KB

Headless = more room for your i18n library.

**5/** The invisible problem: ARIA translation.

`aria-label="Close tour"` means Arabic screen reader users hear English pronounced with Arabic phonetics.

Add every aria-label, aria-live announcement, and role description to your translation files.

**6/** Full guide with code examples, i18n library comparison table, and RTL keyboard navigation patterns:

https://usertourkit.com/blog/i18n-product-tours-rtl-plurals

Built with Tour Kit — headless product tours for React.
