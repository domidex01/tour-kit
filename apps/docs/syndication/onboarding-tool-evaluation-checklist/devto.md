---
title: "The 8-point checklist for evaluating product tour tools (from an engineering perspective)"
published: false
description: "Most onboarding tool evaluations are written for PMs. Here's the engineering checklist: bundle size, TypeScript support, accessibility, testability, vendor lock-in, and more."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/onboarding-tool-evaluation-checklist
cover_image: https://usertourkit.com/og-images/onboarding-tool-evaluation-checklist.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-tool-evaluation-checklist)*

# Onboarding tool evaluation checklist for engineering teams

Most onboarding tool evaluations are written for product managers comparing SaaS dashboards. They rank tools by "ease of use" and "no-code builder" and call it a day. But if your engineering team is the one integrating, maintaining, and debugging the thing at 2am, you need different criteria.

We built Tour Kit and spent months evaluating the same tools we compete against. That makes us biased, but it also means we know exactly which questions surface real differences between options. Every criterion below is something we tested firsthand. Use this checklist even if you pick a competitor.

```bash
npm install @tourkit/core @tourkit/react
```

## What is an onboarding tool evaluation checklist?

An onboarding tool evaluation checklist is a structured scorecard that engineering teams use to compare product tour libraries, digital adoption platforms, and in-house solutions across technical criteria before committing to integration. Unlike vendor-marketing feature matrices, an engineering checklist scores dimensions that affect your daily workflow. Bundle size impact on Core Web Vitals, TypeScript type inference quality, accessibility compliance depth, and migration difficulty if you need to switch later. As of April 2026, no widely-cited evaluation framework targets engineering teams specifically ([ZTABS](https://ztabs.co/blog/software-vendor-evaluation-scorecard), [Whatfix](https://whatfix.com/blog/build-vs-buy-user-onboarding/)).

## The 8-criteria engineering evaluation checklist

We scored each criterion on a 1-5 scale when evaluating tools for our own projects. You should do the same. A spreadsheet with weighted scores beats gut feeling every time. Recency bias skews decisions toward the last vendor you demoed ([ZTABS](https://ztabs.co/blog/software-vendor-evaluation-scorecard)).

### 1. Bundle size and runtime performance

Measure the gzipped transfer size and parse time of each tool, not the number on their marketing page.

| Tool | Gzipped size | Dependencies | Tree-shakeable |
|------|-------------|--------------|----------------|
| Tour Kit (core + react) | <20KB | 0 runtime | Yes (10 packages) |
| React Joyride | ~37KB | 5+ (includes react-floater) | No |
| Shepherd.js | ~28KB | 2+ (Floating UI) | Partial |
| Driver.js | ~5KB | 0 | No (single bundle) |
| Appcues (SaaS) | ~180KB | External script | N/A |

**Score 5:** Under 15KB gzipped, zero runtime dependencies, fully tree-shakeable.
**Score 1:** Over 100KB, external script injection, no tree-shaking.

### 2. TypeScript support quality

"Has TypeScript types" is not the same as "good TypeScript support." Check these specifics:

- Are types shipped with the package or from `@types/*`?
- Does the API use generics for step data?
- Does `strict: true` compile without errors?
- Are hook return types inferred correctly?

```tsx
// Tour Kit: step metadata is generic and type-safe
import { useTour } from '@tourkit/react';

interface StepMeta {
  analyticsId: string;
  requiredRole: 'admin' | 'user';
}

const { currentStep } = useTour<StepMeta>();
// currentStep.meta.analyticsId is typed as string
```

**Score 5:** First-party types, generics for custom data, strict mode clean.
**Score 1:** No types, or `@types/*` package months behind.

### 3. Accessibility compliance

A new academic framework called POUR+ (Perceivability, Operability, Understandability, Personalisation) was designed specifically for sequential onboarding flows ([Research Square](https://www.researchsquare.com/article/rs-8795738/v1)). A real-world evaluation scored only 2.9/5 overall.

Test each tool against:
- **Perceivability:** Screen reader announcement sequence
- **Operability:** Focus trap, keyboard nav, touch targets (44x44px min)
- **Understandability:** Logical focus order
- **Personalisation:** Pause, skip, restart, pacing controls

**Score 5:** Zero axe-core violations, full POUR+ compliance.
**Score 1:** No ARIA attributes, no keyboard navigation.

### 4. Architecture and design system compatibility

Three questions:

1. **Headless or opinionated?** Headless gives you logic without prescribing UI.
2. **Styling approach?** Inline styles are impossible to override with Tailwind without `!important`.
3. **Composition model?** Individual pieces or all-or-nothing?

```tsx
// Headless approach: Tour Kit with your shadcn/ui components
import { useTourStep } from '@tourkit/react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function TourTooltip() {
  const { step, next, prev, isFirst, isLast } = useTourStep();
  return (
    <Card>
      <CardContent>{step.content}</CardContent>
      <CardFooter>
        {!isFirst && <Button variant="ghost" onClick={prev}>Back</Button>}
        <Button onClick={next}>{isLast ? 'Done' : 'Next'}</Button>
      </CardFooter>
    </Card>
  );
}
```

**Score 5:** Headless architecture, CSS class-based styling, composable packages.
**Score 1:** Opinionated UI, inline styles only, monolithic bundle.

### 5. Framework version compatibility

Verify React 19 support, Next.js App Router handling, and strict mode behavior. React Joyride and Shepherd's React wrapper both lack React 19 compatibility as of early 2026 ([Sandro Roth](https://sandroroth.com/blog/evaluating-tour-libraries/)).

**Score 5:** React 18 + 19 native support, strict mode tested in CI.
**Score 1:** Last framework update 12+ months ago.

### 6. Testability and CI/CD integration

Can you programmatically start, advance, and complete tours in test environments? Does the tool work with Playwright, Cypress, or Testing Library?

```tsx
import { renderHook, act } from '@testing-library/react';
import { useTour } from '@tourkit/react';

test('tour advances to next step', () => {
  const { result } = renderHook(() => useTour(), {
    wrapper: TourProvider,
  });
  act(() => result.current.start());
  expect(result.current.currentStep?.id).toBe('step-1');
  act(() => result.current.next());
  expect(result.current.currentStep?.id).toBe('step-2');
});
```

**Score 5:** Hooks-based API testable with Testing Library, graceful degradation.
**Score 1:** No programmatic API, requires real browser to test.

### 7. Vendor lock-in and data portability

Evaluate the exit cost: Can you export tour definitions? How is content stored? What happens when you cancel? Open-source libraries score highest by default.

**Score 5:** Code-owned definitions, no external dependencies, documented migration path.
**Score 1:** Vendor-hosted content, no export, no migration docs.

### 8. Licensing and total cost of ownership

MIT, Apache 2.0, and AGPL have very different implications. Calculate 3-year TCO:

- **Open-source (MIT):** $0 license + developer integration time
- **One-time license:** Upfront cost + developer time (Tour Kit Pro: $99)
- **SaaS subscription:** Monthly cost x 36 months + MAU scaling

**Score 5:** MIT license, predictable pricing, no per-MAU scaling.
**Score 1:** AGPL or proprietary with MAU-based pricing.

## The scorecard template

| Criterion | Weight | Tool A | Tool B | Tool C |
|-----------|--------|--------|--------|--------|
| 1. Bundle size / performance | 1-3x | /5 | /5 | /5 |
| 2. TypeScript support | 1-3x | /5 | /5 | /5 |
| 3. Accessibility | 1-3x | /5 | /5 | /5 |
| 4. Architecture / design system | 1-3x | /5 | /5 | /5 |
| 5. Framework compatibility | 1-3x | /5 | /5 | /5 |
| 6. Testability / CI/CD | 1-3x | /5 | /5 | /5 |
| 7. Vendor lock-in risk | 1-3x | /5 | /5 | /5 |
| 8. Licensing / TCO | 1-3x | /5 | /5 | /5 |
| **Weighted total** | | **/120** | **/120** | **/120** |

Set each weight to 1x, 2x, or 3x based on your priorities.

---

Full article with additional context, FAQ, and evaluation process details: [usertourkit.com/blog/onboarding-tool-evaluation-checklist](https://usertourkit.com/blog/onboarding-tool-evaluation-checklist)
