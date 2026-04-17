---
title: "Build a feature announcement banner in React (with frequency control + analytics)"
published: false
description: "Most React banner tutorials stop at useState. This one adds localStorage persistence, 5 frequency rules, analytics callbacks, and WCAG-compliant ARIA — in under 60 lines."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/feature-announcement-banner-react
cover_image: https://usertourkit.com/og-images/feature-announcement-banner-react.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/feature-announcement-banner-react)*

# How to create a feature announcement banner in React

You shipped a new feature. Now you need users to actually notice it. Email open rates sit around 20% on average, push notifications get muted by roughly 60% of mobile users, and changelog pages collect dust. In-app banners reach 100% of active users because they appear right where the user is already looking ([Flows.sh, 2026](https://flows.sh/blog/building-in-app-announcement)). OpenAI used in-app banners as the primary channel for the GPT-4o launch announcement to their existing user base ([Arcade, 2026](https://www.arcade.software/post/feature-announcement-examples)).

The problem is that most "React banner" tutorials stop at a hardcoded `useState` toggle. That works for a hackathon. It doesn't work when you need banners that remember who dismissed them, show only three times, or fire an analytics event on click.

This tutorial builds a production-grade feature announcement banner using `@tour-kit/announcements`. You'll start with a zero-config styled banner, swap to a headless version for full design control, then add frequency rules and analytics. Total code: under 60 lines.

```bash
npm install @tour-kit/announcements
```

## What you'll build

Tour Kit's `@tour-kit/announcements` package gives you a feature announcement banner that persists dismissal state to `localStorage`, respects 5 configurable frequency rules (`once`, `session`, `always`, N-times, and interval-based), fires callbacks for analytics tracking, and renders with `role="alert"` for screen readers. We tested the full setup in a Vite 6 + React 19 + TypeScript 5.7 project, and the banner added under 4KB gzipped to the client bundle. The entire implementation below takes about 60 lines across 3 files.

## Prerequisites

- React 18.2+ or React 19
- TypeScript 5.0+
- A React project (Vite, Next.js, or CRA all work)
- Basic familiarity with React context and hooks

## Step 1: set up the announcements provider

Every feature announcement banner in React needs three things: state management, persistence across sessions, and a way to control display frequency. The `AnnouncementsProvider` component handles all three using a `useReducer` internally, writing dismissal timestamps and view counts to `localStorage` under the `tour-kit:announcements:` key prefix. Wrap it around your app and pass an array of `AnnouncementConfig` objects defining each banner.

```tsx
// src/providers/announcements.tsx
import {
  AnnouncementsProvider,
  type AnnouncementConfig,
} from '@tour-kit/announcements'

const announcements: AnnouncementConfig[] = [
  {
    id: 'dark-mode-launch',
    variant: 'banner',
    title: 'Dark mode is here',
    description: 'Switch to dark mode from your settings page.',
    priority: 'normal',
    frequency: 'once',
    bannerOptions: {
      position: 'top',
      dismissable: true,
      intent: 'info',
    },
    primaryAction: {
      label: 'Try it now',
      onClick: () => window.location.assign('/settings'),
      dismissOnClick: true,
    },
  },
]

export function AppAnnouncements({ children }: { children: React.ReactNode }) {
  return (
    <AnnouncementsProvider
      announcements={announcements}
      onAnnouncementShow={(id) => console.log('shown:', id)}
      onAnnouncementDismiss={(id, reason) =>
        console.log('dismissed:', id, reason)
      }
    >
      {children}
    </AnnouncementsProvider>
  )
}
```

The `frequency: 'once'` setting means a user sees this banner exactly one time. After dismissal, `AnnouncementsProvider` writes the state to `localStorage` and never shows it again. No cookie library, no backend call.

## Step 2: render the styled banner

Tour Kit ships a pre-styled `AnnouncementBanner` component that renders a full-width strip with 4 intent variants (info, success, warning, error), an optional sticky mode, and built-in close button with `aria-label`. We measured initial render at under 2ms in React DevTools Profiler on an M1 MacBook. Drop it into your layout and pass the announcement ID.

```tsx
// src/components/layout.tsx
import { AnnouncementBanner } from '@tour-kit/announcements'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AnnouncementBanner id="dark-mode-launch" />
      <nav>{/* your navigation */}</nav>
      <main>{children}</main>
    </div>
  )
}
```

That's 7 lines of JSX. The banner reads its title, description, and actions from the config you passed to the provider. It renders with `role="alert"`, so screen readers (NVDA, VoiceOver, JAWS) announce it immediately when it appears. The close button ships with `aria-label="Close announcement"` by default.

## Step 3: switch to headless for full design control

The styled `AnnouncementBanner` adds approximately 1.2KB of CSS to your bundle through class-variance-authority variants. If you already have a design system (shadcn/ui, Radix, Mantine), that's wasted bytes. The `HeadlessBanner` component provides identical state management through a render prop but ships 0KB of CSS. You write the markup; Tour Kit handles the `role="alert"` attribute, `data-state` transitions, dismissal persistence, and frequency logic.

```tsx
// src/components/feature-banner.tsx
import { HeadlessBanner } from '@tour-kit/announcements'

export function FeatureBanner({ id }: { id: string }) {
  return (
    <HeadlessBanner id={id}>
      {({ open, config, dismiss, bannerProps }) => {
        if (!open) return null

        return (
          <div
            {...bannerProps}
            className="flex items-center gap-4 bg-blue-50 px-4 py-3
                       border-b border-blue-200 text-blue-900 text-sm"
          >
            <p className="flex-1">
              <strong>{config?.title}</strong>
              {config?.description && ` — ${config.description}`}
            </p>

            {config?.primaryAction && (
              <a
                href="/settings"
                className="font-medium underline hover:no-underline"
                onClick={() => {
                  config.primaryAction?.onClick?.()
                  dismiss('primary_action')
                }}
              >
                {config.primaryAction.label}
              </a>
            )}

            <button
              type="button"
              onClick={() => dismiss('close_button')}
              aria-label="Dismiss announcement"
              className="text-blue-700 hover:text-blue-900"
            >
              ✕
            </button>
          </div>
        )
      }}
    </HeadlessBanner>
  )
}
```

The `bannerProps` spread gives you `role="alert"` and `data-state="open"` or `data-state="closed"` automatically. You control everything else: layout, colors, animation, the close button icon.

One thing to watch: the `role="alert"` container should be empty on initial page load. Screen readers only announce content that changes dynamically inside an alert region ([A11y Collective, 2026](https://www.a11y-collective.com/blog/aria-alert/)). Tour Kit handles this correctly because the `HeadlessBanner` returns `null` when `open` is false, then renders the alert content when the announcement becomes active.

## Step 4: configure frequency and intent variants

Banner fatigue kills engagement. We tested a banner with `frequency: 'always'` on an internal dashboard and users stopped reading it after day 2. Tour Kit provides 5 frequency rules that persist view counts and dismissal timestamps to `localStorage`, so you can match the display cadence to the urgency of each announcement without writing any persistence code yourself.

```tsx
// src/config/announcements.ts
import type { AnnouncementConfig } from '@tour-kit/announcements'

export const announcements: AnnouncementConfig[] = [
  {
    id: 'v2-api-launch',
    variant: 'banner',
    title: 'API v2 is live',
    description: 'Migrate before June 30 to avoid breaking changes.',
    priority: 'high',
    frequency: { type: 'interval', days: 7 },
    bannerOptions: {
      position: 'top',
      dismissable: true,
      intent: 'warning',
      sticky: true,
    },
    primaryAction: {
      label: 'Read migration guide',
      href: '/docs/migration',
      dismissOnClick: false,
    },
  },
  {
    id: 'dark-mode-launch',
    variant: 'banner',
    title: 'Dark mode is here',
    description: 'Switch from your settings page.',
    frequency: 'once',
    bannerOptions: { position: 'top', dismissable: true, intent: 'info' },
    primaryAction: {
      label: 'Try it now',
      onClick: () => window.location.assign('/settings'),
      dismissOnClick: true,
    },
  },
  {
    id: 'maintenance-window',
    variant: 'banner',
    title: 'Scheduled maintenance: April 15, 2AM–4AM UTC',
    frequency: { type: 'times', count: 3 },
    bannerOptions: { position: 'top', intent: 'error', dismissable: true },
  },
]
```

Three frequency modes in play here:

- `{ type: 'interval', days: 7 }` — the API migration warning reappears every 7 days until the user completes the migration. Persistent but not annoying.
- `'once'` — dark mode announcement shows one time, done.
- `{ type: 'times', count: 3 }` — maintenance notice shows 3 times total across sessions. After the third view, it stays dismissed.

As Shopify's Polaris design system recommends: "Focus on a single theme, piece of information, or required action... be limited to a few important calls to action with no more than one primary action" ([Shopify Polaris docs](https://polaris-react.shopify.com/components/feedback-indicators/banner)). Keep banner copy short.

## Step 5: add analytics callbacks

Knowing a banner was displayed is only half the picture. Tour Kit's `AnnouncementsProvider` accepts 3 callback props that fire on show, dismiss, and complete events, giving you vendor-agnostic analytics hooks.

```tsx
// src/providers/announcements.tsx
import { AnnouncementsProvider } from '@tour-kit/announcements'
import { announcements } from '../config/announcements'

export function AppAnnouncements({ children }: { children: React.ReactNode }) {
  return (
    <AnnouncementsProvider
      announcements={announcements}
      onAnnouncementShow={(id) => {
        analytics.track('announcement_shown', { id, timestamp: Date.now() })
      }}
      onAnnouncementDismiss={(id, reason) => {
        analytics.track('announcement_dismissed', { id, reason })
      }}
      onAnnouncementComplete={(id) => {
        analytics.track('announcement_completed', { id })
      }}
    >
      {children}
    </AnnouncementsProvider>
  )
}
```

Tour Kit tracks 7 distinct dismissal reasons: `'close_button'`, `'escape_key'`, `'overlay_click'`, `'primary_action'`, `'secondary_action'`, `'auto_dismiss'`, and `'programmatic'`. If most users dismiss via the close button rather than clicking the action, the CTA copy needs work.

## Common issues and troubleshooting

### "Banner doesn't appear after provider setup"

Check that the announcement config `id` matches what you pass to `AnnouncementBanner`. Also check `localStorage` — open DevTools and look for `tour-kit:announcements:dark-mode-launch`. If it exists with `isDismissed: true`, delete the key or call `reset(id)` from context.

### "Banner re-renders the entire page"

Move your `AnnouncementConfig[]` array to a module-level constant (outside the component) or memoize it with `useMemo`. Inline array literals recreate on every render and trigger context updates.

### "Screen reader doesn't announce the banner"

The `role="alert"` element must be in the DOM and empty before content is injected. Tour Kit handles this correctly by default, but if you build a fully custom implementation, make sure the alert container exists on mount and the text appears inside it dynamically.

## FAQ

**What is a feature announcement banner in React?**
A UI strip pinned to the top or bottom of your React app that notifies users about new features. Tour Kit's `AnnouncementBanner` renders with `role="alert"` for screen readers and persists dismissal state to `localStorage`.

**How do you prevent banner fatigue?**
Tour Kit's `frequency` property controls display cadence — `'once'` for one-time, `{ type: 'times', count: 3 }` for capped views, `{ type: 'interval', days: 7 }` for recurring. All tracked automatically in `localStorage`.

**Can I style it with Tailwind or shadcn/ui?**
Yes. Use the `HeadlessBanner` component with a render prop for full control over markup. Tour Kit handles state, persistence, and accessibility attributes.

---

Full article with all code examples: [usertourkit.com/blog/feature-announcement-banner-react](https://usertourkit.com/blog/feature-announcement-banner-react)
