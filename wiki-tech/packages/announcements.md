---
title: "@tour-kit/announcements"
type: package
package: "@tour-kit/announcements"
version: 0.2.0
sources:
  - ../packages/announcements/CLAUDE.md
  - ../packages/announcements/package.json
  - ../packages/announcements/src/index.ts
updated: 2026-04-26
---

*Product announcements with 5 UI variants (Modal, Slideout, Banner, Toast, Spotlight), a priority queue, and frequency rules.*

## Identity

| | |
|---|---|
| Name | `@tour-kit/announcements` |
| Version | 0.2.0 |
| Tier | Pro (license-gated) |
| Deps | `@tour-kit/core`, `@tour-kit/license`, `@floating-ui/react`, `@radix-ui/react-slot`, `@radix-ui/react-dialog`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Optional peers | `tailwindcss`, `@mui/base`, `@tour-kit/scheduling` |

`@tour-kit/scheduling` is an **optional peer** — required only if you pass a `schedule` prop to an announcement.

## Variants

| Variant | When to use |
|---|---|
| **Modal** | Centered dialog for important announcements; blocks UI |
| **Slideout** | Side panel for detailed content; non-blocking |
| **Banner** | Top/bottom strip for persistent messages |
| **Toast** | Corner notifications with auto-dismiss timer |
| **Spotlight** | Highlights a target element with floating content |

## Public API

### Styled components

```ts
AnnouncementOverlay, AnnouncementClose, AnnouncementContent, AnnouncementActions
AnnouncementModal, AnnouncementSlideout, AnnouncementBanner, AnnouncementToast, AnnouncementSpotlight
```

Each has its own `*Props` type alias.

### Headless components

```ts
HeadlessModal, HeadlessSlideout, HeadlessBanner, HeadlessToast, HeadlessSpotlight
```

Each exports `*Props` and `*RenderProps` for the render-prop API.

### Context & provider

```ts
AnnouncementsProvider
AnnouncementsContext, useAnnouncementsContext
```

### Hooks

```ts
useAnnouncement(id)   → UseAnnouncementReturn
useAnnouncements()    → UseAnnouncementsReturn  (filterable: AnnouncementsFilter)
useAnnouncementQueue()→ UseAnnouncementQueueReturn
```

### Core utilities

```ts
PriorityQueue, createComparator       // queue primitives
AnnouncementScheduler                 // queue manager
canShowByFrequency, canShowAfterDismissal, getViewLimit  // frequency
matchesAudience, validateConditions   // audience targeting
```

### UI variants (CVA)

```ts
modalOverlayVariants, modalContentVariants
slideoutOverlayVariants, slideoutContentVariants
bannerVariants
toastContainerVariants, toastVariants, toastProgressVariants
spotlightOverlayVariants, spotlightContentVariants
```

### Types

- **Announcement**: `AnnouncementVariant`, `AnnouncementPriority`, `FrequencyRule`, `DismissalReason`, `AnnouncementState`, `AnnouncementAction`, `AnnouncementMedia`, `AnnouncementConfig`, `AudienceCondition`, `AnnouncementStorageAdapter`
- **Position**: `BannerPosition`, `SlideoutPosition`, `ToastPosition`
- **Variant options**: `ModalOptions`, `SlideoutOptions`, `BannerOptions`, `ToastOptions`, `SpotlightOptions`
- **Context**: `AnnouncementsContextValue`, `AnnouncementsProviderProps`
- **Queue**: `PriorityOrder`, `StackBehavior`, `QueueConfig`, `QueueItem`, plus `DEFAULT_QUEUE_CONFIG` runtime export
- **Events**: `AnnouncementEventType`, `BaseAnnouncementEvent`, `AnnouncementRegisteredEvent`, `AnnouncementShownEvent`, `AnnouncementDismissedEvent`, `AnnouncementCompletedEvent`, `AnnouncementActionClickedEvent`, `AnnouncementQueuedEvent`, `AnnouncementDequeuedEvent`, `AnnouncementEvent`

### Slot

```ts
cn, Slot, UnifiedSlot, RenderProp, UnifiedSlotProps
UILibraryProvider, useUILibrary, UILibrary, UILibraryProviderProps
```

## Queue & frequency

### Priority order

`critical` > `high` > `normal` > `low`. Configurable via `QueueConfig`.

### Stack behaviors

- `queue` — show one at a time; next dequeues when current dismisses
- `replace` — new announcement replaces current
- `stack` — multiple shown simultaneously, up to `maxConcurrent`

### Frequency rules

```ts
type FrequencyRule =
  | 'once'                              // ever
  | 'session'                           // per browser session
  | 'always'                            // every time conditions match
  | { type: 'times', count: N }         // up to N times total
  | { type: 'interval', days: N }       // every N days
```

## Gotchas

- **`show()` may queue.** If at `maxConcurrent`, the call returns immediately and the announcement enters the queue — it doesn't render synchronously.
- **Frequency persists in localStorage** by default. Pass a custom `AnnouncementStorageAdapter` for cookies, memory, or remote.
- **Schedule integration.** Pass `schedule` prop only if `@tour-kit/scheduling` is installed; otherwise it's a no-op.
- **Audience targeting.** `userContext` flows through the provider and is matched against `AudienceCondition`s — without it, audience-targeted announcements never show.

## Related

- [packages/core.md](core.md) — storage adapters, position math
- [packages/scheduling.md](scheduling.md) — optional time-based gating
- [packages/license.md](license.md) — gating
- [concepts/queue-and-frequency.md](../concepts/queue-and-frequency.md)
- [concepts/audience-targeting.md](../concepts/audience-targeting.md)
