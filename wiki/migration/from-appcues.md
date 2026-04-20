---
title: Migrating from Appcues
type: content
sources:
  - ../../marketing-strategy/competitive-landscape.md
  - ../../marketing-strategy/Articles/competitors/08-appcues.md
updated: 2026-04-19
---

*Appcues → TourKit. The "replace $300/mo SaaS with $99 library" migration. Target audience: Product Manager ICP with engineering approval.*

## Why migrate

- **Cost:** Appcues Essentials $249/mo ($2,988/yr). Growth $879/mo ($10,548/yr). TourKit Pro: $99 once.
- **MAU-based pricing escalates with success.** 5K → 50K MAUs without changing usage still raises your bill.
- **Iframe overlay doesn't match your design system.** Even with custom CSS, it's not native.
- **Vendor lock-in.** Tours live in Appcues. Canceling = rebuild everything.
- **Performance overhead:** ~100–200KB third-party JS impacts Core Web Vitals.
- **You need engineering anyway.** No-code builders hit limits (CSS hacks, dynamic targeting, SPA routing).

3-year cost comparison:

| | Year 1 | Year 3 |
|---|---|---|
| TourKit Pro | $99 | $99 |
| Appcues Essentials | $2,988 | $8,964 |
| Appcues Growth | $10,548 | $31,644 |

## Feature mapping

| Appcues concept | TourKit equivalent | Package |
|---|---|---|
| Tour flow (Appcues builder) | `<Tour>` + `<TourStep>` | `@tour-kit/react` |
| Checklist | `<Checklist>` + task deps | `@tour-kit/checklists` (Pro) |
| Modal announcement | `<Modal>` announcement | `@tour-kit/announcements` (Pro) |
| Banner announcement | `<Banner>` announcement | `@tour-kit/announcements` (Pro) |
| Tooltip / hotspot | `@tour-kit/hints` (beacon + hint) | `@tour-kit/hints` (free) |
| NPS / CSAT survey | `<Survey>` | `@tour-kit/surveys` (Pro) |
| Segments / targeting | Your auth + feature flags (e.g. GrowthBook, PostHog) | Bring your own |
| A/B testing | Your experimentation tool (PostHog, Statsig) | Bring your own |
| Analytics | `@tour-kit/analytics` with PostHog/Mixpanel/Amplitude adapter | `@tour-kit/analytics` (Pro) |
| Goals tracking | Your analytics events | Bring your own |
| In-app resource center | Not in TourKit scope | — |

## Side-by-side

**Before (Appcues):** Flows live in Appcues. Codebase loads the script:

```html
<script src="//fast.appcues.com/ACCOUNT_ID.js"></script>
<script>
  window.Appcues.identify(userId, { email, plan, signupDate });
  window.Appcues.track('Dashboard Viewed');
</script>
```

No source-controlled tour definition. Tour changes happen inside Appcues UI.

**After (TourKit):** Tours are code in your repo:

```tsx
// app/onboarding/tour.tsx
import { Tour, TourStep } from '@tour-kit/react';

export function OnboardingTour() {
  return (
    <Tour id="onboarding" autoStart>
      <TourStep id="welcome" target="#welcome-btn"
        title="Welcome!" content="Let's take a quick tour." placement="bottom" />
      <TourStep id="dashboard" target="#dashboard"
        title="Dashboard" content="Your data overview." placement="right" />
    </Tour>
  );
}
```

Targeting via your auth + feature flags:

```tsx
const showTour = useFeatureFlag('onboarding_v2') && user.signupDate > recentCutoff;
{showTour && <OnboardingTour />}
```

Analytics via `@tour-kit/analytics`:

```tsx
<TourKitProvider analytics={{ adapter: posthogAdapter(posthog) }}>
  {children}
</TourKitProvider>
```

## Migration steps

1. **Audit what's live in Appcues.** Export a list: tours, checklists, modals, surveys, targeting rules, goals.

2. **Install TourKit:**
   ```bash
   pnpm add @tour-kit/react @tour-kit/checklists @tour-kit/announcements @tour-kit/analytics
   ```

3. **Recreate targeting in code.** Segments become feature flags + auth/user attributes. Use your existing tools (GrowthBook, LaunchDarkly, PostHog feature flags).

4. **Port tours first (highest value).** One tour at a time. Start with the onboarding flow.

5. **Port checklists and announcements.** `@tour-kit/checklists` supports task dependencies; `@tour-kit/announcements` covers modals/toasts/banners/slideouts/spotlights.

6. **Wire up analytics.** Pick one adapter (PostHog, Mixpanel, Amplitude) via `@tour-kit/analytics`. Map Appcues events to your analytics event names.

7. **Cut over.** Remove the Appcues script. Cancel the Appcues subscription at the end of the billing period.

8. **Measure.** Watch activation rate for a few weeks. TourKit won't match Appcues's no-code iteration speed out of the box, but it usually matches Appcues's end-user UX since the code is in your app.

## Common pitfalls

- **Underestimating segmentation work.** If Appcues targeting is complex, mapping it to your feature-flag tool is the biggest migration cost — plan for 1–2 eng weeks.
- **Missing in-app resource center.** TourKit doesn't ship one. If you rely on Appcues's resource center, find a separate tool (or build with `@tour-kit/announcements` + search).
- **PMs losing the WYSIWYG builder.** Code-first means PMs file tickets instead of editing. Mitigate with: (a) tour configs in a single `tours/` directory, (b) short feedback loop with eng, (c) use feature flags so eng can ship PM-authored changes behind toggles.
- **Analytics event-name drift.** Keep a mapping doc between old Appcues event names and new `@tour-kit/analytics` events so historical dashboards still make sense.

## What TourKit does NOT do (honest about trade-offs)

- **No WYSIWYG visual builder.** Appcues wins here for PM-led teams. See [audience/anti-personas.md](../audience/anti-personas.md).
- **No in-app resource center.** Userflow and Userpilot have this; TourKit doesn't.
- **No native NPS reporting dashboard.** `@tour-kit/surveys` collects responses; you visualize them in your analytics tool.
- **No bundled A/B testing.** Use your experimentation stack.

## ROI framing (for the business case)

For a Growth-plan Appcues customer ($10,548/yr):

- **Migration cost (one-time):** 1–2 eng-weeks = $3,200–$12,800
- **Year 1 TourKit Pro:** $99
- **Year 1 savings:** $10,548 − $99 − migration = **$3,000 to $7,200 net savings** in year 1
- **Year 2+ savings:** ~$10,500/year (no migration cost)

## Resources

- [competitors/saas/appcues.md](../competitors/saas/appcues.md) — Full competitive analysis
- [product/licensing.md](../product/licensing.md) — Pricing rationale
- [audience/product-manager.md](../audience/product-manager.md) — The ICP most likely leaving Appcues
- [audience/objections.md](../audience/objections.md) — "We lose the no-code editor"

## Related

- [migration/index.md](index.md)
- [migration/from-react-joyride.md](from-react-joyride.md) — For the engineering team doing the port
- [competitors/saas/userpilot.md](../competitors/saas/userpilot.md) — Similar migration from different vendor
