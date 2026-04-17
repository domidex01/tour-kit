---
title: "The i18n problem nobody talks about: internationalizing product tours"
published: false
description: "Every i18n guide covers translating your app. None cover translating your onboarding. Here's how to handle RTL tooltip positioning, ICU plurals for step counters, and ARIA translation in React tours."
tags: react, javascript, i18n, webdev
canonical_url: https://usertourkit.com/blog/i18n-product-tours-rtl-plurals
cover_image: https://usertourkit.com/og-images/i18n-product-tours-rtl-plurals.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/i18n-product-tours-rtl-plurals)*

# Internationalization (i18n) in product tours: RTL, plurals, and more

Every i18n guide covers translating your app. None of them cover translating your onboarding.

That's a problem. 75% of internet users speak a language other than English, and your product tour is the first thing they interact with. A tour that says "Next" when the user reads right-to-left, or "Step 1 of 5" when Arabic requires a dual noun form, breaks trust before your product gets a chance to build it.

This guide covers the specific i18n challenges in product tours that nobody else has written about. RTL tooltip positioning, plural rules for step counters, translating ARIA labels, keyboard navigation reversal. Plus how to pick an i18n library that won't double your bundle size.

```bash
npm install @tourkit/core @tourkit/react
```

## What is product tour i18n?

Product tour internationalization is the process of adapting onboarding flows (step content, tooltip positioning, progress indicators, button labels, accessibility announcements) for users across different languages, scripts, and reading directions. Unlike general app i18n, which primarily deals with translating static UI strings, tour i18n involves dynamic, sequenced content that interacts with tooltip placement engines and focus management systems. As of April 2026, no major product tour library (React Joyride, Shepherd.js, Driver.js, Intro.js) documents an i18n strategy in their guides, leaving teams to figure it out from scratch.

## Why product tour i18n matters

Most React i18n follows a straightforward pattern: extract strings, create translation files, load the right locale at runtime. Tours add three layers of complexity on top of that baseline.

First, tooltip positioning is directional. A tooltip anchored to the "right" side of an element needs to flip to the "left" in RTL layouts. Most positioning engines handle this automatically when you use CSS logical properties. But if your tour library uses hardcoded `left`/`right` offsets (and many still do), every tooltip breaks in Arabic and Hebrew.

Second, progress indicators need plural rules. "Step 1 of 5" seems simple. Then you hit Arabic, which has six plural categories including a dual form. Polish treats numbers ending in 2-4 differently from those ending in 5-9. ICU MessageFormat handles this, but tour libraries ship progress components that ignore pluralization entirely.

Third, tour content is sequential and timed. A user reads a tooltip, processes the instruction, then clicks "Next." German text expands 30-40% compared to English. If your tooltip has a fixed width, German translations overflow. If you truncate, users miss the instruction.

## RTL tooltip positioning

Right-to-left support in product tours breaks at the tooltip level. Why? Most positioning libraries default to physical CSS properties. When a tour step says `placement: "right"`, the tooltip appears to the right of the target element. In an RTL layout, "right" is where content starts, not where it ends. The tooltip covers the element it's supposed to explain.

[Floating UI](https://floating-ui.com/) handles RTL correctly when you pass `rtl: true` to the middleware. Tour Kit uses Floating UI under the hood, so placement mirroring works out of the box. But custom tour steps still need careful handling of arrow positioning and offset direction.

### CSS logical properties fix arrow positioning

Mozilla bug [#1277207](https://bugzilla.mozilla.org/show_bug.cgi?id=1277207) documents tooltip arrows breaking in RTL because they use `left` for positioning. The fix is CSS logical properties, which have full browser support in 2026.

```tsx
// Physical properties (breaks in RTL)
const brokenArrow = {
  left: '12px',
  top: '-6px',
};

// Logical properties (works in both directions)
const fixedArrow = {
  insetInlineStart: '12px',
  insetBlockStart: '-6px',
};
```

Replace every `left`/`right`/`top`/`bottom` in your tooltip styles with `inset-inline-start`/`inset-inline-end`/`inset-block-start`/`inset-block-end`. This single change handles all RTL languages without separate stylesheets. Ahmad Shadeed's [RTL Styling 101](https://css-tricks.com/rtl-styling-101/) on CSS-Tricks covers the full property mapping.

### Floating UI RTL configuration

```tsx
import { useFloating, offset, flip, shift } from '@floating-ui/react';

function TourStep({ placement = 'right', children }) {
  const isRtl = document.documentElement.dir === 'rtl';

  const { refs, floatingStyles } = useFloating({
    placement,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
    ],
    // Floating UI auto-mirrors placement in RTL
    // "right" becomes "left" when dir="rtl"
  });

  return (
    <div ref={refs.setFloating} style={floatingStyles}>
      {children}
    </div>
  );
}
```

Floating UI mirrors placement automatically based on the `dir` attribute on the document root. No conditional logic needed. Just make sure your root `<html>` element has the correct `dir` value.

## Translating step content

Tour step content is just React components, which means any i18n library that works with React works with your tour steps. The question is which one to pick, and the answer depends on your existing stack and bundle budget.

### i18n library comparison for tour projects

| Library | Bundle size (min+gzip) | ICU plural support | React Server Components | Best for |
|---------|----------------------|-------------------|----------------------|---------|
| next-intl | 457 B | ICU subset | Native | Next.js App Router projects |
| typesafe-i18n | ~1 KB | Custom | Yes | Smallest possible runtime |
| LinguiJS | ~10.4 KB | Full ICU | Yes | Compile-time extraction + type safety |
| react-i18next | ~22.2 KB (with i18next) | Via plugin | Yes | Largest ecosystem, most plugins |
| FormatJS / react-intl | ~17.8–20 KB | Full ICU | Yes | Full ICU compliance at any cost |

As of April 2026, react-i18next has 3.5M+ weekly npm downloads and the largest plugin ecosystem, but [carries more boilerplate than newer alternatives](https://dev.to/erayg/best-i18n-libraries-for-nextjs-react-react-native-in-2026-honest-comparison-3m8f). FormatJS provides the most complete ICU implementation but ships at ~20KB gzipped. For tour-heavy apps where bundle size matters, LinguiJS at 10.4KB offers full ICU support with compile-time extraction.

### Wiring translations to tour steps

Here's a practical pattern using react-i18next, since it's the most widely adopted:

```tsx
import { useTranslation } from 'react-i18next';
import { useTour } from '@tourkit/react';

function OnboardingTour() {
  const { t } = useTranslation('onboarding');

  const steps = [
    {
      target: '#dashboard-nav',
      title: t('steps.dashboard.title'),
      content: t('steps.dashboard.content'),
    },
    {
      target: '#create-button',
      title: t('steps.create.title'),
      content: t('steps.create.content'),
    },
  ];

  const tour = useTour({ steps });
  return <>{tour.currentStep && <TourTooltip step={tour.currentStep} />}</>;
}
```

Tour Kit is headless, so the translation layer sits in your code, not inside the library. You control how strings load and what fallback to use. Opinionated tour libraries that ship pre-built tooltips force you into their string handling, which rarely supports ICU plurals or namespaced translation files.

## ICU plurals for step counters

"Step 1 of 5" is the most overlooked i18n problem in product tours. English has two plural forms: singular and plural. Arabic has six. Polish distinguishes between numbers ending in 2-4 and those ending in 5-9. The [ICU MessageFormat specification](https://phrase.com/blog/posts/guide-to-the-icu-message-format/) handles all of these cases with a single syntax.

ICU defines six plural categories: `zero`, `one`, `two`, `few`, `many`, and `other`. Every language maps its numbers to these categories differently. The `other` category is always required as a fallback.

```tsx
import { FormattedMessage } from 'react-intl';

function TourProgress({ current, total }: { current: number; total: number }) {
  return (
    <span aria-live="polite">
      <FormattedMessage
        id="tour.progress"
        defaultMessage="Step {current} of {total}"
        values={{ current, total }}
      />
    </span>
  );
}
```

```json
// English: simple cardinal
{ "tour.progress": "Step {current} of {total}" }

// Arabic: uses dual form for 2
{
  "tour.progress": "{total, plural, =1 {الخطوة {current} من خطوة واحدة} =2 {الخطوة {current} من خطوتين} other {الخطوة {current} من {total} خطوات}}"
}
```

## Translating ARIA labels in tours

Tour components carry ARIA attributes that rarely get translated: `aria-label` on close buttons, `aria-live` regions for step announcements, `role="dialog"` labels on overlay containers. If your tour's close button has `aria-label="Close tour"` and a screen reader user browses in Arabic, they hear English pronounced with Arabic phonetics. As [IntlPull's i18n accessibility guide](https://intlpull.com/blog/i18n-accessibility-a11y-localization-guide-2026) puts it: "Untranslated ARIA labels create confusing experiences."

Three ARIA patterns matter most for tours:

1. `aria-live="polite"` on step content containers, so new step content gets announced in the user's language.
2. `aria-label` on every interactive element (buttons, close icons). Screen readers read these aloud, so they need translation.
3. The `lang` attribute on mixed-language content. Wrap Japanese tour steps in `<span lang="ja">` so the screen reader uses the right TTS voice.

## RTL keyboard navigation in tours

Tours are sequential, and sequence has direction. In LTR, right arrow means "next." In RTL, those meanings flip.

```tsx
function useTourKeyboard(tour: TourInstance) {
  const isRtl = document.documentElement.dir === 'rtl';

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
      const prevKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

      if (e.key === nextKey) tour.next();
      if (e.key === prevKey) tour.prev();
      if (e.key === 'Escape') tour.close();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isRtl, tour]);
}
```

Tab order reverses automatically when `dir="rtl"` is set on the document, but only for elements in normal flow. Focus traps inside tour modals need explicit testing.

## Combined bundle cost: tour library + i18n library

Nobody publishes the combined bundle cost of a product tour library and an i18n library. Here's what we measured:

| Combination | Combined size (min+gzip) | Notes |
|------------|------------------------|-------|
| Tour Kit + next-intl | ~8.5 KB | Smallest option for Next.js |
| Tour Kit + typesafe-i18n | ~9 KB | Framework-agnostic lightweight |
| Tour Kit + LinguiJS | ~18.4 KB | Full ICU with compile-time extraction |
| Tour Kit + react-i18next | ~30.2 KB | Largest ecosystem |
| React Joyride + react-i18next | ~59.2 KB | Joyride ships at 37KB alone |
| Shepherd.js + react-i18next | ~67 KB | Shepherd is ~45KB gzipped |

Tour Kit's core at ~8KB gzipped leaves room for whichever i18n library your project already uses.

## Common mistakes to avoid

**Hardcoding button labels.** "Next," "Previous," "Skip," "Done" appear in every tour. Extract them into your translation files on day one.

**Forgetting `dir` on the tour container.** If your tour renders in a portal, the portal container may not inherit `dir`. Pass it explicitly.

**Using physical CSS properties.** `margin-left: 8px` on a tooltip works in English and breaks in Arabic. `margin-inline-start: 8px` works in both.

**Ignoring plural categories.** String interpolation produces grammatically incorrect text in most non-English languages. Use ICU MessageFormat.

**Skipping ARIA translation.** ARIA attributes are invisible in the UI, so they're routinely missed. Add every `aria-label` to your translation files.

## FAQ

**How do I add RTL support to an existing product tour?**
Tour Kit mirrors tooltip placement automatically when `dir="rtl"` is set via Floating UI. Replace physical CSS properties with logical equivalents. Arrow key mappings need explicit reversal too. Most teams retrofit RTL in a single sprint.

**Which i18n library works best with React product tours?**
It depends on your framework and bundle budget. For Next.js App Router, next-intl at 457 bytes is lightest. For full ICU plural support, LinguiJS at 10.4KB is the sweet spot. Tour Kit is headless and works with all of them.

**Do I need ICU MessageFormat for tour step counters?**
Yes, if you support languages beyond Western European ones. Arabic has six plural categories, Polish distinguishes numbers ending in 2-4. ICU MessageFormat handles all these cases with a single syntax.

**What's the bundle size cost of adding i18n to a product tour?**
Tour Kit's core ships at ~8KB gzipped. Combined with next-intl (457B), total payload is ~8.5KB. React Joyride (37KB) plus react-i18next totals ~59KB. Headless tour libraries leave more budget for the i18n library your project needs.
