# dashboard-next — canonical Tour Kit integration

A Next.js 16 + React 19 + Tailwind v4 + shadcn/ui dashboard that exercises every
`@tour-kit/*` package. Lives in this monorepo as the reference for the full
suite; all packages resolve via `workspace:*`.

## Stack

- Next.js 16.2 (App Router, Turbopack)
- React 19.2
- Tailwind CSS v4
- shadcn/ui on `@base-ui/react`
- All 11 `@tour-kit/*` packages

## Run

```bash
# From the monorepo root
pnpm install
pnpm --filter dashboard-next dev
```

Open http://localhost:3000 (or 3001 if 3000 is taken).

`.env.local` (all optional on localhost — license validation bypasses dev hosts,
and the `/api/chat` route returns a stub when `OPENAI_API_KEY` is empty):

```
NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY=
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=
OPENAI_API_KEY=
```

## Package map

| Package | File | What it does here |
| --- | --- | --- |
| `@tour-kit/license` | `app/providers.tsx`, `app/dashboard/settings/page.tsx`, `components/tour-kit/license-debug-panel.tsx` | Wraps the app in `<LicenseProvider>`; Settings → Billing gates `<AdvancedBillingControls>` behind `<LicenseGate require="pro">`; debug panel prints `useLicense()` state. |
| `@tour-kit/analytics` | `app/providers.tsx` | `consolePlugin` streams tour/hint/announcement/checklist/adoption events to the browser console. |
| `@tour-kit/react` | `components/tour-kit/onboarding-tour.tsx` | 5-step dashboard onboarding tour that autostarts on first visit. `onComplete` persists to localStorage and triggers the CSAT survey. |
| `@tour-kit/hints` | `components/tour-kit/hints.tsx` | `DarkModeHint` on `#dark-mode-toggle` (rendered by dashboard layout); `ExportHint` on `#export-btn` (rendered by project kanban page). |
| `@tour-kit/announcements` | `lib/tour-kit-config.ts`, `components/tour-kit/announcements-host.tsx`, `components/tour-kit/scheduled-banner.tsx` | Three announcements: welcome modal (with embedded `TourMedia`), maintenance banner (Pro-audience + schedule-gated), AI-live toast. |
| `@tour-kit/checklists` | `lib/tour-kit-config.ts`, `components/tour-kit/checklist-dock.tsx` | 4-item "Get started" checklist with `ChecklistLauncher`/`ChecklistPanel`. Event bridge listens for `project:created`, `team:invite-sent`, `kanban:card-moved` and auto-completes tasks. |
| `@tour-kit/adoption` | `lib/tour-kit-config.ts`, `app/dashboard/projects/[id]/page.tsx` | Tracks `dark-mode`, `keyboard-shortcuts`, `export-csv`. `<IfNotAdopted>` + `<NewFeatureBadge>` on the Export button fades out after use. |
| `@tour-kit/media` | `components/tour-kit/announcements-host.tsx` | `<TourMedia>` with a YouTube URL inside the welcome modal; platform detection handles Loom/YouTube/Vimeo automatically. |
| `@tour-kit/scheduling` | `components/tour-kit/scheduled-banner.tsx` | `useSchedule({ daysOfWeek: [1..5], timeOfDay: '09:00–17:00' })` gates the maintenance banner. Logs `reason` to console outside business hours. |
| `@tour-kit/surveys` | `lib/tour-kit-config.ts`, `components/tour-kit/csat-survey-host.tsx` | CSAT modal ("How was the walkthrough?") shown from the onboarding tour's `onComplete` hook. 90-day cooldown. |
| `@tour-kit/ai` | `app/api/chat/route.ts`, `components/tour-kit/ai-chat-host.tsx`, `app/dashboard/help/page.tsx` | `createChatRouteHandler` server route; `useAiChat().toggle()` drives the "Ask AI" floating button on `/dashboard/help`; `AiChatPanel` renders the transcript with `tourContext: true`. |

## Target element IDs

The tour, hints, and adoption triggers all target stable IDs:

| ID | Owning file |
| --- | --- |
| `#sidebar-nav` | `components/dashboard/sidebar.tsx` |
| `#new-project-btn` | `app/dashboard/page.tsx` |
| `#search-input` | `components/dashboard/topbar.tsx` |
| `#notifications-btn` | `components/dashboard/topbar.tsx` |
| `#user-menu` | `components/dashboard/topbar.tsx` |
| `#dark-mode-toggle` | `components/theme-toggle.tsx` |
| `#shortcuts-btn` | `components/dashboard/topbar.tsx` |
| `#kanban-board` | `app/dashboard/projects/[id]/page.tsx` |
| `#export-btn` | `app/dashboard/projects/[id]/page.tsx` |
| `#help-launcher` | `app/dashboard/help/page.tsx` |

## Provider stack (`app/providers.tsx`)

```
LicenseProvider
└── AnalyticsProvider
    └── TourKitProvider
        └── HintsProvider
            └── AnnouncementsProvider
                └── ChecklistProvider
                    └── AdoptionProvider
                        └── SurveysProvider
                            └── AiChatProvider
```

## Scripts

- `pnpm dev` — dev server (Turbopack)
- `pnpm build` — production build
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — ESLint (Next 16 standalone)

## Notes & gotchas

- `@tour-kit/*` deps resolve via `workspace:*`; changes in `packages/*` appear
  here immediately on the next `pnpm --filter dashboard-next dev` run.
- `ai@^5` pairs with `@tour-kit/ai`'s peer dep. `@ai-sdk/openai@^2` matches.
  Bumping either without the other fails typecheck (`LanguageModelV2` vs `V3`).
- `@mui/base@5.0.0-beta.70` is a peer dep of `@tour-kit/*` — deprecated on
  npm but still works. Separate from `@base-ui/react` (which powers shadcn).
- `@lottiefiles/react-lottie-player` is a runtime-only dynamic import in
  `@tour-kit/media`; Turbopack needs it installed even if unused.
- The root layout sets `suppressHydrationWarning` because `next-themes`
  mutates `<html class>` client-side on first paint.
- **Production build is currently blocked** by a Next 16.2 / React 19.2 /
  Turbopack prerender quirk on the synthetic `/_global-error` and `/_not-found`
  routes (`TypeError: Cannot read properties of null (reading 'useContext')`).
  Dev mode and `pnpm typecheck` both work. Track
  [`vercel/next.js` tracking issue] once identified; upstream fix required.

## What was stripped vs the upstream demo

Tour Kit 0.4.3+ closed three bugs this example used to work around:

- `OnboardingTour` no longer needs a manual `tour.start()` helper — it uses
  `<Tour id="..." autoStart>` now that `@tour-kit/core` honors the prop.
- `components/tour-kit/announcements-bootstrap.tsx` was deleted — registered
  announcements auto-show by default in `@tour-kit/announcements` 0.1.5+.
- The `maintenance` config in `lib/tour-kit-config.ts` opts out with
  `autoShow: false` because `<ScheduledBanner>` drives it only during
  business hours.
