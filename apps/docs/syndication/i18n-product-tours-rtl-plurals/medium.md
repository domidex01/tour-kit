# The i18n problem nobody talks about: product tours

## Your onboarding flow is probably broken in Arabic, Hebrew, and 40+ other languages

*Originally published at [usertourkit.com](https://usertourkit.com/blog/i18n-product-tours-rtl-plurals)*

Every i18n guide covers translating your app. None of them cover translating your onboarding.

That's a problem. 75% of internet users speak a language other than English, and your product tour is the first thing they interact with. A tour that says "Next" when the user reads right-to-left, or "Step 1 of 5" when Arabic requires a dual noun form, breaks trust before your product gets a chance to build it.

I wrote a deep-dive covering the specific i18n challenges in product tours that nobody else has addressed:

**RTL tooltip positioning** — When a tour step says `placement: "right"`, the tooltip appears to the right of the target element. In an RTL layout, "right" is where content starts, not where it ends. The tooltip covers the element it's supposed to explain. CSS logical properties and Floating UI solve this.

**ICU plurals for step counters** — "Step 1 of 5" requires plural rules that differ across languages. Arabic has six plural categories including a dual form. Polish treats numbers ending in 2-4 differently from those ending in 5-9.

**ARIA translation** — Tour components carry ARIA attributes that rarely get translated. If your close button has `aria-label="Close tour"` and a screen reader user browses in Arabic, they hear English pronounced with Arabic phonetics.

**Bundle size** — Nobody publishes the combined cost of a tour library + i18n library. Tour Kit (~8KB) + next-intl (457B) = ~8.5KB total. React Joyride (37KB) + react-i18next (22KB) = ~59KB.

**RTL keyboard navigation** — Arrow key meanings flip in RTL. Right arrow means "previous" instead of "next."

The full article includes working code examples, comparison tables for i18n libraries, and specific patterns for each challenge.

Read the full guide: [Internationalization (i18n) in product tours: RTL, plurals, and more](https://usertourkit.com/blog/i18n-product-tours-rtl-plurals)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
