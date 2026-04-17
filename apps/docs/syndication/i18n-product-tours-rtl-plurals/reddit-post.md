## Subreddit: r/reactjs (primary), r/i18n (secondary)

**Title:** I wrote a guide on internationalizing product tours — RTL tooltip positioning, ICU plurals for step counters, ARIA translation

**Body:**

I've been working on i18n for a React product tour library and realized there's basically zero content about internationalizing onboarding flows specifically. Every i18n guide covers general app translation, but tours have unique problems:

**RTL tooltip positioning breaks silently.** When your tour step says `placement: "right"`, the tooltip covers the target element in RTL layouts because "right" is where content starts, not ends. Floating UI handles this automatically, but only if your CSS uses logical properties (`inset-inline-start` instead of `left`). Mozilla bug #1277207 documents the exact arrow positioning issue.

**"Step 1 of 5" is grammatically wrong in most languages.** Arabic has six plural categories including a dual form for two items. Polish treats numbers ending in 2-4 differently from 5-9. You need ICU MessageFormat, not string interpolation.

**Nobody publishes combined bundle sizes.** Tour library + i18n library together: Tour Kit (~8KB) + next-intl (457B) = ~8.5KB. React Joyride (37KB) + react-i18next (22KB) = ~59KB. The headless approach leaves more room for whichever i18n library you already use.

**ARIA labels don't translate themselves.** `aria-label="Close tour"` means a screen reader user in Arabic hears English pronounced with Arabic phonetics.

I included code examples for each problem, a comparison table of i18n libraries by bundle size and ICU support, and RTL keyboard navigation handling.

Full article with code: https://usertourkit.com/blog/i18n-product-tours-rtl-plurals

Curious if anyone else has run into these issues. How do you handle i18n in your onboarding flows?
