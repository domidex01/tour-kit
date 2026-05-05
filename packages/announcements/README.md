# @tour-kit/announcements

> In-app product announcements for React — modal, toast, banner, slideout, spotlight with frequency rules and changelog support.

[![npm version](https://img.shields.io/npm/v/@tour-kit/announcements.svg)](https://www.npmjs.com/package/@tour-kit/announcements)
[![npm downloads](https://img.shields.io/npm/dm/@tour-kit/announcements.svg)](https://www.npmjs.com/package/@tour-kit/announcements)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tour-kit/announcements?label=gzip)](https://bundlephobia.com/package/@tour-kit/announcements)
[![types](https://img.shields.io/npm/types/@tour-kit/announcements.svg)](https://www.npmjs.com/package/@tour-kit/announcements)

Drop-in **product announcements**, **what's-new modals**, **release notes**, and **in-app notifications** for React. Five UI variants — Modal, Slideout, Banner, Toast, Spotlight — with a priority queue, frequency rules, audience targeting, and optional schedule gating.

> **Pro tier** — requires a license key. See [Licensing](https://usertourkit.com/docs/licensing).

**Alternative to:** [Headway](https://headwayapp.co/), [Beamer](https://www.getbeamer.com/), [Announcekit](https://announcekit.app/), [Pendo](https://www.pendo.io/) announcements, [LaunchNotes](https://www.launchnotes.com/), in-app changelog widgets.

## Features

- **5 display variants** — Modal, Slideout, Banner, Toast, Spotlight
- **Priority queue** — `critical` > `high` > `normal` > `low`
- **Stack behaviors** — `queue`, `replace`, or `stack` up to `maxConcurrent`
- **Frequency rules** — `once`, `session`, `always`, `times: N`, `interval: days`
- **Audience targeting** — show announcements only to matching user segments
- **Optional schedule** — pair with [`@tour-kit/scheduling`](https://www.npmjs.com/package/@tour-kit/scheduling) for time-windowed releases
- **Headless variants** with render props for full UI control
- **Persistence** via custom `AnnouncementStorageAdapter` (localStorage by default)
- **TypeScript-first**, supports React 18 & 19

## Installation

```bash
npm install @tour-kit/announcements @tour-kit/license
# or
pnpm add @tour-kit/announcements @tour-kit/license
```

## Quick Start

```tsx
import { LicenseProvider } from '@tour-kit/license'
import { AnnouncementsProvider, AnnouncementModal } from '@tour-kit/announcements'

function App() {
  return (
    <LicenseProvider licenseKey={process.env.NEXT_PUBLIC_TOURKIT_LICENSE!}>
      <AnnouncementsProvider
        announcements={[
          {
            id: 'welcome',
            variant: 'modal',
            title: 'Welcome to v2!',
            description: "Here's what's new.",
            frequency: 'once',
          },
        ]}
      >
        <AnnouncementModal id="welcome" />
        <YourApp />
      </AnnouncementsProvider>
    </LicenseProvider>
  )
}
```

Registered announcements that pass their eligibility checks **auto-show** on mount. Set `autoShow: false` on a config to trigger imperatively via `show(id)`.

## i18n & interpolation

All user-facing strings in `@tour-kit/announcements` accept the `{{var | fallback}}` interpolation grammar from `@tour-kit/core`. Wrap your tree in `<LocaleProvider>` and every announcement title and description resolves automatically.

```tsx
import { LocaleProvider } from '@tour-kit/core'
import { AnnouncementsProvider, AnnouncementModal } from '@tour-kit/announcements'

<LocaleProvider locale="en" messages={{ 'welcome.title': 'Hi {{user.name | there}} — what is new' }}>
  <AnnouncementsProvider
    announcements={[{ id: 'welcome', variant: 'modal', title: { key: 'welcome.title' }, description: 'See the highlights below.' }]}
  >
    <AnnouncementModal id="welcome" />
  </AnnouncementsProvider>
</LocaleProvider>
```

> Full guide: https://usertourkit.com/docs/guides/i18n

### Public changelog page

`@tour-kit/announcements` also exports `<ChangelogPage>` (server-renderable, category filter, emoji reactions, media support) plus `serializeFeed()` for RSS 2.0 + JSON Feed 1.1 syndication. The page lives behind the `@tour-kit/announcements/changelog` subpath so toast/modal/banner-only consumers tree-shake out the renderer.

> Full guide: https://usertourkit.com/docs/announcements/changelog

## Variants

| Variant | When to use |
|---|---|
| **Modal** | Centered dialog for important announcements; blocks UI |
| **Slideout** | Side panel for detailed content; non-blocking |
| **Banner** | Top/bottom strip for persistent messages |
| **Toast** | Corner notification with auto-dismiss timer |
| **Spotlight** | Highlights a target element with floating content |

## Frequency rules

```ts
type FrequencyRule =
  | 'once'                              // ever
  | 'session'                           // per browser session
  | 'always'                            // every time conditions match
  | { type: 'times', count: N }         // up to N times total
  | { type: 'interval', days: N }       // every N days
```

## Headless components

```tsx
import { HeadlessToast } from '@tour-kit/announcements/headless'

<HeadlessToast
  id="release-notes"
  render={({ isVisible, dismiss, announcement, progress }) => (
    isVisible ? (
      <div className="custom-toast">
        <h3>{announcement.title}</h3>
        <button onClick={dismiss}>×</button>
      </div>
    ) : null
  )}
/>
```

Available headless components: `HeadlessModal`, `HeadlessSlideout`, `HeadlessBanner`, `HeadlessToast`, `HeadlessSpotlight`.

## API Reference

### Components (styled)

| Export | Purpose |
|---|---|
| `AnnouncementsProvider` | Context provider — registers announcements, manages queue |
| `AnnouncementModal` | Centered dialog variant |
| `AnnouncementSlideout` | Side panel variant |
| `AnnouncementBanner` | Top/bottom strip variant |
| `AnnouncementToast` | Corner toast variant with auto-dismiss |
| `AnnouncementSpotlight` | Element highlight variant |
| `AnnouncementOverlay` | Background overlay primitive |
| `AnnouncementClose`, `AnnouncementContent`, `AnnouncementActions` | Sub-components |

### Hooks

| Hook | Description |
|---|---|
| `useAnnouncement(id)` | Single announcement state + `show`, `dismiss`, `complete`, `actionClicked` |
| `useAnnouncements(filter?)` | All announcements (filter by variant, status, etc.) |
| `useAnnouncementQueue()` | Queue inspection: current, queued, dequeue manually |
| `useAnnouncementsContext()` | Raw context (advanced) |

### Core utilities

| Export | Purpose |
|---|---|
| `PriorityQueue`, `createComparator` | Queue primitives |
| `AnnouncementScheduler` | Queue manager |
| `canShowByFrequency`, `canShowAfterDismissal`, `getViewLimit` | Frequency evaluation |
| `matchesAudience`, `validateConditions` | Audience targeting |

### Variants (CVA)

```ts
import {
  modalOverlayVariants, modalContentVariants,
  slideoutOverlayVariants, slideoutContentVariants,
  bannerVariants,
  toastContainerVariants, toastVariants, toastProgressVariants,
  spotlightOverlayVariants, spotlightContentVariants,
} from '@tour-kit/announcements'
```

### Types

```ts
import type {
  AnnouncementConfig,
  AnnouncementVariant,           // 'modal' | 'slideout' | 'banner' | 'toast' | 'spotlight'
  AnnouncementPriority,          // 'critical' | 'high' | 'normal' | 'low'
  AnnouncementState,
  AnnouncementAction,
  AnnouncementMedia,
  FrequencyRule,
  DismissalReason,
  AudienceCondition,
  AnnouncementStorageAdapter,
  // Position
  BannerPosition, SlideoutPosition, ToastPosition,
  // Variant options
  ModalOptions, SlideoutOptions, BannerOptions, ToastOptions, SpotlightOptions,
  // Queue
  PriorityOrder, StackBehavior, QueueConfig, QueueItem,
  // Context
  AnnouncementsContextValue, AnnouncementsProviderProps,
  // Events
  AnnouncementEvent, AnnouncementEventType,
} from '@tour-kit/announcements'

// Runtime export
import { DEFAULT_QUEUE_CONFIG } from '@tour-kit/announcements'
```

## Gotchas

- **`show()` may queue** — at `maxConcurrent`, the call returns immediately and enters the queue rather than rendering.
- **Frequency persists in localStorage** by default — incognito mode bypasses, custom adapter for cookies / remote.
- **Audience targeting needs `userContext`** — pass it to the provider, otherwise audience-targeted announcements never show.
- **`@tour-kit/scheduling` is optional** — only required if you pass a `schedule` prop.

## Related packages

- [`@tour-kit/scheduling`](https://www.npmjs.com/package/@tour-kit/scheduling) — schedule announcements with timezone-aware rules
- [`@tour-kit/react`](https://www.npmjs.com/package/@tour-kit/react) — sequential product tours
- [`@tour-kit/hints`](https://www.npmjs.com/package/@tour-kit/hints) — single-element feature hints
- [`@tour-kit/checklists`](https://www.npmjs.com/package/@tour-kit/checklists) — onboarding checklists
- [`@tour-kit/license`](https://www.npmjs.com/package/@tour-kit/license) — required Pro license key validation

## Documentation

Full documentation: [https://usertourkit.com/docs/announcements](https://usertourkit.com/docs/announcements)

## License

Pro tier — see [LICENSE.md](./LICENSE.md). Requires a Tour Kit Pro license key.
