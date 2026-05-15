# Fix: dashboard-next Phase 8 QA findings

**Packages:** `@tour-kit/analytics`, `@tour-kit/react`, `@tour-kit/core`, `@tour-kit/media`, `@tour-kit/announcements`, `@tour-kit/scheduling`, `@tour-kit/ai`, `@tour-kit/adoption`, `examples/dashboard-next`
**Type:** Bugfix / integration hardening
**Status:** Planned (revised 2026-05-15 after codebase audit + Context7 validation)

## Goal

Make the canonical `examples/dashboard-next` QA pass for Phase 8 in both license scenarios:

- Scenario A: empty `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY`, localhost, soft gate active, one watermark on every route.
- Scenario B: non-empty `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY`, localhost dev bypass, Pro UI without watermark.

The license gate behavior itself passed manual QA. Do not change the `LicenseGate` soft-gate contract unless new evidence shows a regression.

## Evidence

Manual QA artifacts (kept locally, not committed):

- `manual-qa-artifacts/phase8/scenario-{a,b}/{checks,watermark-counts,console-events}.json`
- `manual-qa-artifacts/phase8/scenario-{a,b}/{dashboard,settings-billing}.png`

Codebase audit (2026-05-15) cross-referenced with Context7 docs for `radix-ui`, `next-themes`, and `@ai-sdk/react` v5. Per-section root causes below.

## Current Findings

1. `@tour-kit/license` passed the Phase 8 contract in both scenarios (see Success Criteria).
2. Analytics did not emit the expected `[tour-kit]` console groups for tour, announcement, hint, checklist, or adoption events.
3. The welcome modal rendered, but the YouTube media rendered as a native video source instead of an embedded YouTube player.
4. `AnnouncementModal` produced Radix accessibility warnings for missing dialog title/description.
5. The maintenance banner did not show during local business hours, and the expected `schedule.reason` diagnostics were not visible.
6. The AI chat panel opened, but the empty-key stub response did not render in the chat UI.
7. The project export `NewFeatureBadge` stayed visible after the export button was clicked.
8. The onboarding tour restarted on later route loads after completion instead of staying completed until site data is cleared.
9. Scenario B showed Next dev overlay / hydration issues, including a mismatch around the notification toaster and a script-tag rendering warning.

## Success Criteria

- Scenario A keeps exactly one `[data-tourkit-watermark]` on `/`, `/dashboard`, `/dashboard/projects`, `/dashboard/projects/:id`, `/dashboard/team`, `/dashboard/help`, and `/dashboard/settings`.
- Scenario B keeps exactly zero `[data-tourkit-watermark]` elements on the same routes.
- Scenario A settings Billing tab shows `status=invalid`, `tier=free`, `0 / 0`, and the UpgradePrompt fallback.
- Scenario B settings Billing tab shows `status=valid`, `tier=pro`, `0 / 0`, runtime `renderKey=dev_bypass`, and AdvancedBillingControls.
- `[tour-kit]` consolePlugin groups are emitted for tour started, tour step viewed, tour completed, announcement shown, hint shown/dismissed, checklist task completed, and adoption events.
- Welcome announcement renders an embedded YouTube player.
- Maintenance banner shows inside Mon-Fri 09:00-17:00 local time, or surfaces a clear `schedule.reason` when hidden outside that window.
- Empty `OPENAI_API_KEY` chat fallback renders a canned assistant response in `AiChatPanel`.
- Export `NewFeatureBadge` fades or disappears after first use.
- Completed tour does not autostart again on route navigation until site data is cleared.
- Manual QA runs without a Next dev overlay or hydration error.

## Non-goals

- Do not change Pro soft-gate semantics. Pro UI should keep rendering; the watermark is the unlicensed signal.
- Do not change localhost dev bypass semantics. Any non-empty key on localhost should remain valid/pro with `renderKey=dev_bypass`.
- Do not run `pnpm build`; Next 16.2 production build is known broken for this example.
- Do not commit `.env.local` or QA artifacts unless explicitly requested.

## Implementation Plan

### 1. Lock License Behavior With Regression Coverage

**Status from audit:** Behavior already correct; only test coverage is missing.

Files to inspect:

- `packages/license/src/context/license-context.tsx`
- `packages/license/src/lib/license-state.ts`
- `packages/license/src/components/license-gate.tsx`
- `examples/dashboard-next/app/providers.tsx`
- `examples/dashboard-next/app/dashboard/settings/page.tsx`

Tasks:

- Add tests for empty-key localhost state: `invalid/free`, no `renderKey`, watermark enabled.
- Add tests for non-empty localhost state: `valid/pro`, `renderKey=dev_bypass`, watermark disabled.
- Do not modify `LicenseGate` behavior unless a test exposes a real regression.

---

### 2. Repair Analytics Bridging (Reframed)

**Audit findings:**

- `packages/analytics/src/core/context.tsx` exposes `useAnalytics()` with an imperative `analytics.track()` API; `consolePlugin` is the registered listener.
- `@tour-kit/adoption` is the ONLY package that auto-emits analytics, via `useAdoptionAnalytics()` (`packages/adoption/src/analytics/use-adoption-analytics.ts`).
- `@tour-kit/react`, `hints`, `announcements`, `checklists` expose callback props only (`onStart`, `onComplete`, `onShow`, `onDismiss`, …) and do NOT call `analytics.track()` themselves.
- `examples/dashboard-next/README.md:76-88` documents a stack containing `TourKitProvider`, but `app/providers.tsx` does not mount it. Tours mount inline in `components/tour-kit/onboarding-tour.tsx` via `<Tour id="dashboard-onboarding" autoStart …>`.

**Decision required (call out in PR):** Treat package-level auto-analytics as the contract going forward, or keep callback-prop pattern and wire it in the example.

Recommended approach (lowest risk, highest leverage):

1. **Inside each package's provider/component**, when an analytics context is available, call `analytics.track(eventName, payload)` alongside the existing user callback. Pattern to mirror: `useAdoptionAnalytics()`. Apply to `react` (tour lifecycle), `hints` (show/dismiss), `announcements` (shown/dismissed), `checklists` (task completed / checklist completed). Use `useAnalyticsOptional()` so packages remain usable without an `AnalyticsProvider`.
2. **Fix the README/provider stack drift**: either add `MultiTourKitProvider` to `app/providers.tsx` and migrate `OnboardingTour` to register through it, OR update the README to reflect that tours mount inline. Pick whichever matches the documented user-facing pattern.
3. **Per-package test**: assert that with a mock analytics plugin attached, each lifecycle event fires `track(...)` once with the expected event name.

Expected result:

- One end-to-end tour run produces `[tour-kit]` console groups for tour, announcement, hint, checklist, and adoption activity, without manual wiring in the example.

---

### 3. Fix YouTube Media Rendering (Root cause = config, not router)

**Audit findings:**

- `packages/media/src/components/media-slot.tsx:272`: `const resolved = type === 'auto' ? detectMediaSlotType(src) : type`. Explicit `type` wins over URL detection.
- `packages/media/src/lib/detect-media-type.ts` already maps `/youtu\.?be/i` → `'youtube'`.
- `examples/dashboard-next/lib/tour-kit-config.ts:21` passes `type: 'video'` for a YouTube URL. `examples/dashboard-next/components/tour-kit/announcements-host.tsx` does the same.

Tasks:

- **Primary fix:** change `type: 'video'` → `type: 'auto'` (or drop `type` entirely if `auto` is the default) in both call sites. This routes the YouTube URL through `YouTubeEmbed`.
- **Package hardening (optional, defensible):** when `type='video'` is explicit but `src` matches a known provider regex, emit a `console.warn` ("explicit type='video' overrides detected youtube URL; pass type='auto' or type='youtube' for embed") and/or auto-correct. Choose one; do not silently change behavior without a warning.
- **Regression test:** in `packages/announcements`, render `AnnouncementContent` with `media={{ type: 'auto', src: 'https://youtube.com/watch?v=…' }}` and assert an `iframe` (not `<video>`) is present.

Expected result:

- Welcome announcement renders a YouTube iframe via `YouTubeEmbed`, not a native `<video src="https://youtube…">`.

---

### 4. Fix Announcement Modal Accessibility

**Audit findings:**

- `packages/announcements/src/components/announcement-modal.tsx` renders `Dialog.Root` → `Dialog.Content` from `@radix-ui/react-dialog`.
- `packages/announcements/src/components/announcement-content.tsx:36-55` renders plain `<h2>` and `<div>` instead of `Dialog.Title` / `Dialog.Description`.
- Per Radix docs (Context7 confirmed): `Dialog.Title` is required for screen-reader announcement; if visually hidden, wrap with `VisuallyHidden`. `Dialog.Description` is optional; to omit it, pass `aria-describedby={undefined}` to `Content`.

Tasks:

- In `AnnouncementContent`, render `<Dialog.Title>` when the dialog modal is the parent, and `<Dialog.Description>` only when `description` is non-empty. For modals without a visible title, wrap the title in `@radix-ui/react-visually-hidden`.
- In `AnnouncementModal`, conditionally pass `aria-describedby={undefined}` to `Dialog.Content` when no description is provided.
- Verify the same `UnifiedSlot` pattern still allows headless override (do not regress consumer composition).
- **Test:** render the modal with title-only, title+description, and headless override; assert no `console.error` from Radix and that `aria-labelledby` resolves to the title element.

Expected result:

- No Radix dialog accessibility warnings during dashboard QA in any modal variant.

---

### 5. Verify Scheduling Visibility + Surface Diagnostics

**Audit findings (revises original framing):**

- `packages/scheduling/src/utils/is-schedule-active.ts` already uses local time via `Intl.DateTimeFormat`. `useSchedule()` exposes `reason: 'wrong_day' | 'wrong_time' | …` via `ScheduleResult`. **The evaluation logic is not broken.**
- `examples/dashboard-next/components/tour-kit/scheduled-banner.tsx:7-11` defines `daysOfWeek: [1..5]`, `timeOfDay: { start:'09:00', end:'17:00' }`, `useUserTimezone: true`. Today is 2026-05-15 Friday — schedule should be active inside business hours.
- Most likely real cause: (a) `ScheduledBanner` is not actually mounted in the dashboard tree, OR (b) the announcement `variant=banner` is not being rendered by the host, OR (c) the QA run actually happened outside business hours and no log surfaced `reason` because the example does not render it.

Tasks:

- Trace mount: confirm `ScheduledBanner` is in `app/dashboard/layout.tsx` or the page tree; if missing, mount it.
- Render `result.reason` in the example UI (small text under the banner or a debug-only `<aside>`) so QA can see why a schedule is hidden.
- Add an `analytics.track('schedule.evaluated', { active, reason })` emission inside `useSchedule` so console logs always capture the decision.
- **Tests:** with fixed `Date` inside/outside Mon-Fri 09-17 (use `vi.setSystemTime`), assert `isActive` toggles and `reason` is `'wrong_day' | 'wrong_time'` accordingly.

Expected result:

- Inside business hours, the maintenance banner renders. Outside, the rendered diagnostic and console event explain why.

---

### 6. Fix Empty-Key AI Chat Fallback (Vercel AI SDK v5 SSE)

**Audit findings (revises original framing):**

- `packages/ai/src/context/ai-chat-provider.tsx:41-65` uses `useChat` from `@ai-sdk/react` with `DefaultChatTransport`. Per Context7 docs: `DefaultChatTransport` requires the Vercel AI SDK v5 **UIMessage SSE stream format** (use `createUIMessageStreamResponse` / `result.toUIMessageStreamResponse()`).
- `examples/dashboard-next/app/api/chat/route.ts:30-37` currently returns `new Response('AI key not configured…', { status: 200 })` — plain text, no `Content-Type: text/event-stream`. The transport tries to parse it as SSE, fails silently, and leaves `messages` empty.

Tasks (pick ONE of A/B; A is preferred):

- **A. Return a valid UIMessage SSE stream from the fallback** using `createUIMessageStreamResponse` (or `simulateReadableStream` from `ai`) emitting a single assistant text part with the canned message. This keeps client transport consistent.
- **B. Switch the package transport to `TextStreamChatTransport`** only when no key is configured (would need a runtime flag). Lossy: no tool calls. Not recommended.
- Update `packages/ai/src/context/ai-chat-provider.tsx` to subscribe `onError` and surface stream failures to the UI rather than silently dropping (defense in depth).
- **Smoke test:** in `examples/dashboard-next`, POST to `/api/chat` with `OPENAI_API_KEY` unset and assert the response `Content-Type` is `text/event-stream` and contains the canned text part.

Expected result:

- `/dashboard/help` renders the canned assistant response when no key is configured; no silent empty-message state.

---

### 7. Fix Adoption Badge First-Use Behavior

**Audit findings:**

- `packages/adoption/src/components/new-feature-badge.tsx` accepts only `featureId`, `text`, `className`, `variant`, `size`. No `hideAfterFirstUse` prop.
- `packages/adoption/src/engine/adoption-calculator.ts:9-41` defines adoption as `useCount >= DEFAULT_MIN_USES` (3) AND used within 30 days. Custom override via `criteria.custom`.
- `examples/dashboard-next/lib/tour-kit-config.ts:104-109` defines the `export-csv` feature without per-feature `criteria`.

Tasks:

- **Primary fix:** add per-feature `criteria: { minUses: 1 }` to the `export-csv` feature definition in the dashboard config, so a single click marks it adopted and hides the badge.
- **Package surface improvement (recommended):** expose an optional `criteria` prop on `<NewFeatureBadge>` and `<IfNotAdopted>` so consumers can override without modifying global feature defaults. Add this without breaking existing usage.
- **Tests:** assert that with `criteria: { minUses: 1 }` the badge hides after a tracked `featureUsed` call; with default criteria it still requires 3 uses.

Expected result:

- Export button shows the badge before first click; the badge fades/disappears after the first click.

---

### 8. Fix Tour Completion Persistence (Package bug, not example)

**Audit findings:**

- `packages/core/src/context/tour-provider.tsx:707-718` autoStart effect checks `persisted?.tourId` (in-progress) but does NOT check `completedTours`. A tour with `autoStart=true` re-runs after completion on every mount.
- Default storage adapter is `localStorage` with prefix `tourkit:` (`packages/core/src/utils/storage.ts`). Completed IDs are persisted to `tourkit:completed`.
- `examples/dashboard-next/components/tour-kit/onboarding-tour.tsx` passes `autoStart` unconditionally.

Tasks:

- **Package fix:** in `tour-provider.tsx` autoStart effect, also short-circuit when `auto.id` is present in the loaded `completedTours` array. Keep existing in-progress short-circuit. Add an explicit `restartCompleted?: boolean` opt-in if backwards compat is a concern.
- Verify `markTourCompleted` writes to `tourkit:completed` synchronously before the next mount.
- **Test:** mount → complete tour → unmount → remount → assert no `START_TOUR` dispatched.
- **Storage cleared regression test:** clear `tourkit:completed` → remount → assert autoStart fires again.

Expected result:

- Completing the onboarding tour prevents later automatic restarts in the same browser state.

---

### 9. Fix Hydration / Dev Overlay (next-themes provider missing)

**Audit findings:**

- `examples/dashboard-next/components/ui/sonner.tsx:10` calls `useTheme()` from `next-themes`.
- `examples/dashboard-next/app/providers.tsx` does NOT mount `<ThemeProvider>`. Theme is only set via an inline `<Script id="theme-init" strategy="beforeInteractive">` in `app/layout.tsx:34`.
- Result: SSR sees `theme=undefined→'system'` (fallback), client sees the same fallback (no provider populates it), but the inline script may have already toggled `<html class="dark">` differently → toaster theme classes mismatch.
- Sonner also renders `<section aria-label="Notifications {hotkey}">`. The `hotkey` string can vary between SSR/CSR depending on OS detection, contributing to the warning.

Tasks:

- Install `next-themes` (or confirm presence) and add `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` at the top of `Providers` in `app/providers.tsx`. Keep `suppressHydrationWarning` on `<html>`.
- Move `<Toaster />` from `app/layout.tsx:40` to inside `<Providers>` so it reads from the now-mounted theme context.
- If the sonner `aria-label` hotkey string still mismatches, gate the `Toaster` behind a client-only `mounted` flag (mount-after-hydrate render) — small wrapper component.
- Grep the dashboard tree for stray `<script>` JSX or `dangerouslySetInnerHTML` paths and remove or isolate any that warn under Next 16.
- **QA smoke check:** load the dashboard with both themes set in OS, confirm no `nextjs-portal` dev overlay and no `Warning: Text content did not match` in console.

Expected result:

- Manual QA runs cleanly without a Next dev overlay; sonner renders themed correctly post-hydrate.

---

## Verification Plan

Do not run `pnpm build`.

Run targeted tests after implementation:

```bash
pnpm --filter @tour-kit/license test
pnpm --filter @tour-kit/analytics test
pnpm --filter @tour-kit/media test
pnpm --filter @tour-kit/announcements test
pnpm --filter @tour-kit/scheduling test
pnpm --filter @tour-kit/ai test
pnpm --filter @tour-kit/adoption test
pnpm --filter @tour-kit/react test
pnpm --filter @tour-kit/core test
pnpm --filter dashboard-next typecheck
```

Repeat manual QA with:

```bash
pnpm --filter dashboard-next dev
```

Use both `.env.local` scenarios:

```dotenv
NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY=
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=
OPENAI_API_KEY=
```

```dotenv
NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY=tk_dev_local_anything
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=
OPENAI_API_KEY=
```

For each scenario, clear localhost site data before the run and capture:

- `/dashboard` screenshot.
- `/dashboard/settings` Billing screenshot.
- Watermark counts for each required route.
- Browser console snapshot with `[tour-kit]` analytics events.

## Suggested Order

Reordered to put low-risk root-cause fixes first; structural work (analytics auto-emit, tour persistence) after.

1. **YouTube config flip** (2-line fix, Section 3).
2. **Modal a11y** — wrap with `Dialog.Title`/`Description` + `VisuallyHidden` fallback (Section 4).
3. **AI fallback SSE response** (Section 6).
4. **Hydration / `ThemeProvider` wire-up** (Section 9).
5. **Adoption `criteria` per feature** + optional prop on badge (Section 7).
6. **Scheduling diagnostics surface** (Section 5).
7. **Tour completion persistence** (package change in `tour-provider.tsx`, Section 8).
8. **Analytics auto-emit per package** (largest scope, Section 2) + README/provider drift fix.
9. **License regression tests** (Section 1).
10. **Full two-scenario manual QA rerun.**
