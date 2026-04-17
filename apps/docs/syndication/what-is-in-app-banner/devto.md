---
title: "What is an in-app banner? Banners vs toasts vs modals explained"
published: false
description: "In-app banners reach 100% of active users. Emails average 20% open rates. Here's what banners are, when to use them over toasts and modals, and how to build one with proper ARIA roles."
tags: react, webdev, javascript, tutorial
canonical_url: https://usertourkit.com/blog/what-is-in-app-banner
cover_image: https://usertourkit.com/og-images/what-is-in-app-banner.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-in-app-banner)*

# What is a banner? In-app announcements and feature releases

You shipped a feature last Tuesday. Your changelog got 40 views. Your email announcement had a 19% open rate. Meanwhile, 100% of your active users loaded the dashboard today and saw nothing.

In-app banners fix that gap. They sit inside the application itself, not in an inbox.

## Definition

An in-app banner is a non-blocking UI element, typically a horizontal strip at the top or bottom of the viewport, that communicates information to users without interrupting their current task. Banners persist until the user dismisses them or the display condition expires. Unlike modals, they don't require interaction before the user can continue working. Unlike toasts, they don't disappear on a timer.

That distinction matters. Banners occupy a specific middle ground in the notification UX spectrum: visible enough to communicate, unobtrusive enough to ignore safely.

## How in-app banners work

An in-app banner renders as a fixed or sticky `<div>` at the viewport edge, handling three concerns that separate a production implementation from a demo: visibility logic that decides when the banner appears based on frequency rules, dismissal persistence that remembers when a user closed it, and accessible markup that communicates the message to assistive technology.

**Visibility** means deciding when the banner appears. A naive implementation uses `useState(true)` and calls it done. That works for a hackathon demo. Production banners need frequency rules: show once ever, once per session, or N times total. Without that control, users see the same announcement on every single page load, and Facebook's own research confirmed that reducing notification volume improved long-term user retention ([Smashing Magazine, 2026](https://www.smashingmagazine.com/2025/12/design-guidelines-notifications-ux/)).

**Dismissal persistence** means remembering that a user closed the banner. For anonymous users, `localStorage` works. Authenticated users who switch devices need server-side storage.

**Accessibility** is where most implementations get it wrong. Here's the gotcha: `role="banner"` is a landmark role for the site header, not a notification. For announcement banners, use `role="alert"` when the message is urgent (downtime, breaking changes) or `role="status"` when it isn't. Screen readers announce `role="alert"` immediately; `role="status"` waits for an idle moment ([W3C WAI-ARIA, Roles](https://www.w3.org/TR/wai-aria-1.2/#alert)).

## In-app banner examples

In-app banners appear in six recurring patterns across SaaS products, ranging from feature announcements that drive adoption to maintenance notices that keep users informed during incidents.

| Banner type | Purpose | Example | Dismissable? |
|---|---|---|---|
| Feature announcement | Tell users about a new capability | Mixpanel announcing a new report builder | Yes |
| Upgrade prompt | Nudge free users toward a paid plan | HubSpot showing plan limits | Yes |
| Maintenance notice | Warn about downtime or degraded service | GitHub status banner during incidents | No |
| Onboarding prompt | Guide new users to a next step | Zapier suggesting a first automation | Yes |
| Feedback request | Ask for input on a beta feature | Monday.com requesting NPS feedback | Yes |
| Seasonal/promotional | Announce a sale or event | Wordtune showing a holiday discount | Yes |

SurferSEO, Mixpanel, and Zapier all use top-of-page banners for feature announcements because they reach every active user without breaking workflow context ([Userpilot, 2026](https://userpilot.com/blog/announcement-banner-examples/)).

## Banners vs toasts vs modals

Banners, toasts, and modals form the three primary in-app messaging patterns, each distinguished by whether they block user interaction and whether they auto-dismiss. Picking the wrong one creates UX friction: a modal for a minor feature update annoys users, while a toast for a critical security warning disappears before anyone reads it.

| Pattern | Blocking? | Auto-dismiss? | Best for | ARIA role |
|---|---|---|---|---|
| Banner | No | No (manual dismiss) | Persistent announcements, status updates | `role="alert"` or `role="status"` |
| Toast | No | Yes (3-8 seconds) | Action confirmations, transient feedback | `role="status"` |
| Modal | Yes (focus trap) | No | Critical decisions, onboarding, consent | `role="dialog"` |

The general rule: if the user needs to act before continuing, use a modal. If the message confirms something the user just did, use a toast. If the message should stay visible but not interrupt, use a banner ([AnnounceKit, 2025](https://announcekit.app/blog/in-app-banners-vs-modals-vs-tooltips)).

## Why in-app banners matter for product teams

Email open rates average around 20%. Push notifications get muted by roughly 60% of mobile users. In-app banners reach 100% of active users because they render where the user already is ([Flows.sh, 2026](https://flows.sh/blog/building-in-app-announcement)).

That 100% reach comes with a risk, though. Overuse kills the signal. When every minor update gets a banner, users train themselves to dismiss without reading. Facebook learned this the hard way: their notification experiments showed that fewer, higher-quality notifications drove better engagement than a constant stream ([Smashing Magazine, 2026](https://www.smashingmagazine.com/2025/12/design-guidelines-notifications-ux/)).

Frequency control is the answer. Limit banners to once per feature release, cap total active banners at one, and tie display rules to actual user behavior, not calendar dates.

## Building an in-app banner in React

Tour Kit's `@tour-kit/announcements` package includes a dedicated `AnnouncementBanner` component with built-in frequency control, dismissal persistence, and `role="alert"` accessibility. It ships at under 4KB gzipped. Here's a minimal example:

```tsx
// src/components/FeatureBanner.tsx
import {
  AnnouncementsProvider,
  AnnouncementBanner,
} from '@tour-kit/announcements'

const announcements = [
  {
    id: 'new-export-feature',
    variant: 'banner' as const,
    title: 'CSV exports are here',
    description: 'Export any report to CSV with one click.',
    frequency: { type: 'times' as const, count: 3 },
    bannerOptions: { position: 'top' as const, intent: 'info' as const },
  },
]

export function FeatureBanner() {
  return (
    <AnnouncementsProvider announcements={announcements}>
      <AnnouncementBanner id="new-export-feature" />
    </AnnouncementsProvider>
  )
}
```

The `frequency` prop accepts 5 rules: `once`, `session`, `always`, `{ type: 'times', count: N }`, and `{ type: 'interval', days: N }`. Dismissal state persists to `localStorage` by default, or you can pass a custom storage adapter for server-side persistence.

For full design control, the headless variant gives you a render prop with all the state and callbacks but zero markup:

```tsx
// src/components/CustomBanner.tsx
import { HeadlessBanner } from '@tour-kit/announcements'

export function CustomBanner() {
  return (
    <HeadlessBanner id="new-export-feature">
      {({ isVisible, dismiss, config }) =>
        isVisible ? (
          <div className="bg-blue-600 text-white px-4 py-2 flex justify-between">
            <span>{config?.title}</span>
            <button onClick={() => dismiss('close_button')}>Close</button>
          </div>
        ) : null
      }
    </HeadlessBanner>
  )
}
```

Tour Kit doesn't have a visual builder. You write JSX. That means your banners match your design system from the start. Learn more in the [Tour Kit announcements documentation](https://usertourkit.com/docs/announcements).

## FAQ

### What is the difference between an in-app banner and a push notification?

An in-app banner renders inside the application UI and only appears while the user has the app open. Push notifications come from the OS and appear even when the app is closed. Banners reach active users with zero permission requirements; push notifications need explicit opt-in and face ~60% muting rates.

### Should in-app banners be dismissable?

Most in-app banners should be dismissable. The exceptions are maintenance notices and critical security warnings where users need ongoing visibility. Dismissable banners must persist their closed state via `localStorage` or server-side storage so they don't reappear on reload.

### What ARIA role should an in-app banner use?

Use `role="alert"` for urgent banners (downtime, security) and `role="status"` for non-urgent announcements (new features, promotions). Don't use `role="banner"` — that's a landmark role for identifying the site header, not a notification.

### How many in-app banners should you show at once?

One. Stacking multiple in-app banners pushes content below the fold and trains users to ignore all of them. Use a priority queue: show the highest-priority banner first, queue the rest.
