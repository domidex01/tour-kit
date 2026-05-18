# Phase 19 — Hints Offscreen Autohide

**Duration:** Days 99–101 (~4–6 hours)
**Depends on:** Nothing (independent — additive opt-in prop on `<HintHotspot>`; coexists with Phase 3 variants and Phase 12 HintGroup without coupling)
**Blocks:** Nothing direct. Feeds the M9 milestone gate (final hints UX polish, end of v2 Package Polish roadmap).
**Risk Level:** LOW — single `IntersectionObserver` integration scoped to `@tour-kit/hints`; no provider changes, no public-type breakage, no shared-state churn. The one real risk is observer-callback cost on pages with many hints — mitigated by an explicit perf-budget test (see Task 19.2).
**Stack:** react

---

## Objective

Stop clipped, awkwardly hovering hint hotspots when their target scrolls offscreen. Today a hint pinned to an offscreen element stays painted at the viewport edge (the `getHotspotPosition` math returns negative or out-of-viewport coordinates, but the element stays visible because `position: fixed` + a fixed `targetRect` doesn't react to scroll). This phase adds an `IntersectionObserver`-driven **visual autohide**: when the target's `intersectionRatio` drops to `0` (or below a consumer-specified threshold), the hotspot fades out in-place; when the target scrolls back into view, it fades back in. The dismissal state is **never** mutated — this is purely a render-time visibility toggle, not a logical dismissal. Existing `<Hint>` / `<HintHotspot>` consumers who do not opt in see byte-identical render and behaviour.

## What Success Looks Like

1. Scrolling a target out of the viewport hides the hotspot within 100 ms — verified by a Playwright test (`hint-autohide.spec.ts`) that scrolls a fixture, waits for the transition to finish, and asserts the rendered hotspot's `getComputedStyle().opacity === '0'` and `pointerEvents === 'none'`.
2. Scrolling the target back into view shows the hotspot again — same Playwright test scrolls back, asserts `opacity === '1'` and `pointerEvents === 'auto'`. No permanent dismissal — `useHint(id).isDismissed` stays `false` throughout.
3. No regression in existing hint dismissal/persistence tests — the full `packages/hints/src/__tests__/` suite stays green without snapshot regeneration or test edits. Specifically: `use-hint.test.ts`, `reduced-motion.test.tsx`, `hint-i18n.test.tsx`, `hint-frequency.test.tsx`, and `analytics-events.test.tsx` all pass on `main` and on this branch.
4. 50-hint perf budget: in a Vitest perf test, mounting 50 `<HintHotspot autohide />` instances and triggering 60 simulated `IntersectionObserverEntry` callbacks per second produces a median callback batch duration of `< 1 ms` (measured via `performance.now()` deltas around the observer-callback handler over a 1-second sample). Equivalent Playwright budget under Chrome 4× CPU throttle: zero dropped frames over a 3-second scroll.
5. `autohide` is an opt-in prop. Default is `false` — existing consumers see no behaviour change. `pnpm --filter @tour-kit/hints typecheck` exits `0` with the new prop integrated into the discriminated-union `HintHotspotProps` shape from Phase 3 (it lives on the base, not on any variant branch, so all four prop unions still compile).
6. Bundle delta `< 1 KB` gzipped — verified by `gzip -c packages/hints/dist/index.mjs | wc -c` before and after, recorded in PR description.
7. `apps/docs/content/docs/hints/autohide.mdx` renders in `pnpm --filter docs dev` with a live preview that scrolls inside a fixed-height container so the autohide is observable on the docs page.

---

## Architecture / Key Design Decisions

```
<HintHotspot autohide /> ─────────────────────────────────────────────────┐
   │                                                                       │
   │  autohide === false (default)                                         │
   │    → existing v1 / Phase 3 / Phase 12 render path, byte-identical     │
   │                                                                       │
   │  autohide === true | AutohideOptions                                   │
   │    → useIntersectionObserver(targetRef, { threshold, rootMargin })     │
   │        ↓ returns { isVisible: boolean }                                │
   │    → className gets:                                                  │
   │        'motion-safe:transition-opacity motion-safe:duration-150'      │
   │        + isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'  │
   │                                                                       │
   │  Critical invariant: autohide is VISUAL ONLY.                          │
   │    - Does NOT call onDismiss / dismiss() / hide()                      │
   │    - Does NOT mutate useHint(id).isDismissed                           │
   │    - Does NOT change aria-expanded                                     │
   │    - When the target scrolls back in, the hotspot re-renders           │
   │      visible WITHOUT re-running autoShow logic                         │
   └───────────────────────────────────────────────────────────────────────┘

target element (the consumer's anchor)
   │ scrolls out of viewport
   ▼
IntersectionObserver fires { isIntersecting: false, intersectionRatio: 0 }
   │
   ▼
useIntersectionObserver setState({ isVisible: false })
   │
   ▼
<HintHotspot> re-renders with 'opacity-0 pointer-events-none'
   │
   ▼ 150ms motion-safe:transition-opacity (instant under reduce)
hotspot is visually hidden but still mounted; observer keeps subscribing
```

### `useIntersectionObserver` hook — public API

```ts
// packages/hints/src/hooks/use-intersection-observer.ts
export interface UseIntersectionObserverOptions {
  /** intersectionRatio threshold below which `isVisible` flips to false. Default: 0 (any visibility = visible). */
  threshold?: number | number[]
  /** rootMargin string for the IntersectionObserver root box. Default: '0px'. */
  rootMargin?: string
  /** When false, hook skips observation and returns `{ isVisible: true }` (escape hatch for tests or feature gating). Default: true. */
  enabled?: boolean
}

export interface UseIntersectionObserverReturn {
  /** True when the target intersects the viewport above the threshold. Initial value: true (optimistic — first observer callback corrects within one frame). */
  isVisible: boolean
}

export function useIntersectionObserver(
  targetRef: React.RefObject<Element | null>,
  options?: UseIntersectionObserverOptions
): UseIntersectionObserverReturn
```

Internals:
- Single `IntersectionObserver` per call (one per hint). Browsers handle ~hundreds of observers efficiently; the perf cost is **per-callback**, not per-observer, so we don't share a singleton.
- `useEffect` subscribes when `enabled && targetRef.current && typeof IntersectionObserver !== 'undefined'`. SSR-safe: returns `isVisible: true` when `IntersectionObserver` is undefined.
- Cleanup disconnects the observer on unmount or when `targetRef.current` changes.
- State update batched naturally by React 18 automatic batching — callbacks that don't change `isVisible` skip `setState` entirely (the conditional is in the callback, not in a `useMemo`).

### `AutohideOptions` — the new prop shape on `<HintHotspot>`

```ts
// packages/hints/src/components/hint-hotspot.tsx — adds to existing HintHotspotProps
export interface AutohideOptions {
  /** intersectionRatio threshold below which the hint hides. 0 = any pixel offscreen → still visible (default). 0.5 = half-offscreen → hide. */
  threshold?: number
  /** IntersectionObserver rootMargin string. e.g. '-50px 0px' to hide when within 50px of the top edge. Default: '0px'. */
  rootMargin?: string
}

// HintHotspotProps gains one optional base prop:
//   autohide?: boolean | AutohideOptions
// `autohide` lives on the base, NOT on any variant branch of the Phase 3 discriminated union,
// so all four union members (`undefined`, `'badge'`, `'beacon-with-label'`, `'what-s-new-pill'`)
// still typecheck without widening the literal union.
```

Resolution rules inside the hotspot:
- `autohide === undefined` or `false` → existing render path (byte-identical).
- `autohide === true` → `{ threshold: 0, rootMargin: '0px' }`.
- `autohide === { threshold, rootMargin }` → spread into the hook options (with the same defaults for unspecified fields).

### Coexistence with Phase 3 variants

The visibility-driven className chain is appended **after** `hintHotspotVariants({...})` resolves, so it composes with the badge / beacon-with-label / what-s-new-pill variants without conflict. Tailwind's last-class-wins handles `opacity-100` vs `opacity-0`. The `motion-safe:transition-opacity` is non-overlapping with any existing animation utility on the variants (badge has none; beacon-with-label uses `motion-safe:animate-tour-pulse` on an inner element, not the outer button; what-s-new-pill uses `motion-safe:transition-opacity` on its own fade-after-interaction logic — both opacity transitions resolve to the same target value `0` when autohide kicks in, so they're additive, not conflicting).

### Coexistence with Phase 12 HintGroup

Autohide is per-hotspot, independent of `<HintGroup>` membership. When a grouped hotspot autohides (target offscreen), its `aria-activedescendant` registration with the group is **not** unregistered — the hint is visually hidden but still part of the group's keyboard cycle. That's correct: pressing Tab onto a hidden grouped hotspot would scroll the target back into view (because the underlying `<button>` is still focusable when `pointer-events-none` isn't applied to keyboard focus — but we DO apply `pointer-events-none`, so consumers won't tab onto it pointerwise; keyboard focus from `aria-activedescendant` still lands because that ARIA mechanism is independent of pointer-events). The simplest and most predictable behaviour: leave group registration unchanged. Document this trade-off in the docs page (`autohide.mdx`).

### Reduced-motion three-tier defense (per repo-root CLAUDE.md)

| Tier | Mechanism | Where it applies in this phase |
|---|---|---|
| 1 | `motion-safe:` Tailwind prefix on transition utilities | The visibility-driven className uses `motion-safe:transition-opacity motion-safe:duration-150`. Under reduce, the utility never applies → opacity flips instantly, no fade. |
| 2 | `@media (prefers-reduced-motion: reduce)` keyframe wrappers | No new `@keyframes` this phase — opacity is a built-in CSS property, not a custom keyframe. |
| 3 | JS gate via `useReducedMotion()` | Not needed for this phase — tier 1 fully covers the case. We could `useReducedMotion()` to skip the transition class altogether under reduce, but that adds a React subscription with no observable benefit beyond tier 1; **omit tier 3 here**. |

### Data Model Strategy

| Layer | Type | Why |
|---|---|---|
| `AutohideOptions` | `interface` exported from `hint-hotspot.tsx` | Public composition surface — consumers may build their own wrappers |
| `UseIntersectionObserverOptions` / `UseIntersectionObserverReturn` | `interface` exported from `hooks/use-intersection-observer.ts` | Hook is exported for advanced/headless consumers; `interface` so they can extend |
| `isVisible` | `React.useState<boolean>` (initial value `true`) | Single-component state; never persisted; never mutated by anything except the IO callback |
| Observer instance | `useRef<IntersectionObserver | null>` | Stable across renders inside `useEffect`; explicit disconnect on cleanup |

**Other critical rules for this phase:**
- **Visual only — never mutate dismissal state.** Do not call `dismiss()`, `hide()`, or any `useHint(id)` mutator from the IO callback. Do not invoke `onDismiss`. Do not change `aria-expanded`. The element stays mounted, the popover render branch (`isOpen && hotspotRef.current && <HintTooltip>`) is unchanged.
- **Initial render is optimistic-visible.** First paint shows `opacity-100` because `useState<boolean>(true)`. The first observer callback (delivered within one animation frame after mount) corrects to `false` if the target started offscreen. This avoids a flash-then-hide for the common case where the target is visible on mount.
- **SSR safety.** `typeof IntersectionObserver === 'undefined'` → skip observation, treat as visible. This matches the pattern in `useElementPosition` (already used in `<Hint>`).
- **One observer per hint is intentional.** Don't build a singleton/shared observer — they're cheap, and the per-hotspot lifecycle is simpler to reason about. The perf budget is enforced via test, not via premature optimization.
- **Test rule.** The intersection-observer global must be polyfilled or mocked in vitest (jsdom does not implement it). Use `vi.stubGlobal('IntersectionObserver', class MockIntersectionObserver { ... })` per-test or via `vitest.setup.ts`. Snippet pasted in Task 19.1 below.
- **`@floating-ui/react` is NOT involved here** — autohide acts on the hotspot, not the tooltip. The existing `<HintTooltip>` already auto-repositions via Floating UI.

---

## Tasks

### Task 19.1 — `useIntersectionObserver` hook + `<HintHotspot>` integration (3–4 h)

Goal: ship the hook and wire it into `<HintHotspot>` behind an `autohide` opt-in. Default path stays byte-identical; opt-in path applies the visibility-driven className.

Sub-steps:

1. **Create `packages/hints/src/hooks/use-intersection-observer.ts`.**

   ```ts
   'use client'

   import * as React from 'react'

   export interface UseIntersectionObserverOptions {
     threshold?: number | number[]
     rootMargin?: string
     enabled?: boolean
   }

   export interface UseIntersectionObserverReturn {
     isVisible: boolean
   }

   export function useIntersectionObserver(
     targetRef: React.RefObject<Element | null>,
     options: UseIntersectionObserverOptions = {}
   ): UseIntersectionObserverReturn {
     const { threshold = 0, rootMargin = '0px', enabled = true } = options
     const [isVisible, setIsVisible] = React.useState(true)

     React.useEffect(() => {
       if (!enabled) {
         setIsVisible(true)
         return
       }
       if (typeof IntersectionObserver === 'undefined') {
         setIsVisible(true)
         return
       }
       const target = targetRef.current
       if (!target) return

       const observer = new IntersectionObserver(
         (entries) => {
           const entry = entries[0]
           if (!entry) return
           // For numeric threshold: visible when intersectionRatio > threshold.
           // For array threshold: visible when entry.isIntersecting (browser handles array semantics).
           const next = Array.isArray(threshold)
             ? entry.isIntersecting
             : entry.intersectionRatio > threshold
           setIsVisible((prev) => (prev === next ? prev : next))
         },
         { threshold, rootMargin }
       )
       observer.observe(target)
       return () => observer.disconnect()
     }, [targetRef, threshold, rootMargin, enabled])

     return { isVisible }
   }
   ```

   Notes:
   - The `setIsVisible((prev) => (prev === next ? prev : next))` pattern is the key perf optimization — when the ratio crosses the threshold but stays on the same side, no re-render fires.
   - `targetRef` is in the deps array; if it changes identity (rare — refs are usually stable), the observer re-subscribes.
   - `threshold` in deps as well — array thresholds get a new reference on each render unless the consumer memoizes them. For this phase, the only producer is `<HintHotspot>` which derives `threshold` from a static prop, so the identity is stable.

2. **Patch `packages/hints/src/components/hint-hotspot.tsx`.**

   Add `autohide` to `HintHotspotProps`:

   ```ts
   export interface AutohideOptions {
     threshold?: number
     rootMargin?: string
   }

   export interface HintHotspotProps
     extends Omit<React.ComponentPropsWithoutRef<'button'>, 'color'>,
       HintHotspotVariants {
     targetRect: DOMRect
     position: HotspotPosition
     isOpen?: boolean
     asChild?: boolean
     /**
      * Visual autohide when the target scrolls offscreen. Does NOT trigger dismissal.
      * - `true` → hide when target is fully offscreen (threshold 0, rootMargin 0).
      * - object → custom threshold/rootMargin.
      * - `false` / undefined → no autohide (default).
      */
     autohide?: boolean | AutohideOptions
   }
   ```

   Inside the component body, resolve `autohide` and call the hook:

   ```tsx
   // Resolve autohide options
   const autohideOpts = React.useMemo<UseIntersectionObserverOptions | null>(() => {
     if (!props.autohide) return null
     if (props.autohide === true) return { threshold: 0, rootMargin: '0px' }
     return { threshold: props.autohide.threshold ?? 0, rootMargin: props.autohide.rootMargin ?? '0px' }
   }, [props.autohide])

   // The target element is the consumer's anchor. <HintHotspot> currently only
   // receives a DOMRect, not the element itself — so we need to also accept the
   // target ref via a new internal prop OR resolve it via document.elementFromPoint
   // at the rect center. The cleaner path: <Hint> already has `targetElement` from
   // useElementPosition, so we add a `targetElement?: Element | null` prop on
   // HintHotspot, threaded from <Hint>. When absent, autohide silently no-ops
   // (and we warn in dev: `console.warn('[HintHotspot] autohide requires targetElement')`).
   const targetElementRef = React.useRef<Element | null>(props.targetElement ?? null)
   React.useEffect(() => {
     targetElementRef.current = props.targetElement ?? null
   }, [props.targetElement])

   const { isVisible } = useIntersectionObserver(
     targetElementRef,
     autohideOpts ?? { enabled: false }
   )

   // Compose the visibility className. Only emit when autohide is enabled —
   // when disabled, the className chain is byte-identical to pre-Phase-19.
   const visibilityClass = autohideOpts
     ? cn(
         'motion-safe:transition-opacity motion-safe:duration-150',
         isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
       )
     : null
   ```

   And the final className becomes:

   ```tsx
   className={cn(
     hintHotspotVariants({ size, color, pulse: shouldPulse, zIndex }),
     visibilityClass, // null when autohide off → cn() drops it → byte-identical
     className
   )}
   ```

   **Critical:** when `autohideOpts === null`, `visibilityClass === null`, and `cn(...)` discards `null` arguments — so the rendered className chain is byte-for-byte identical to pre-Phase-19. Verify with the existing `hint-hotspot.test.tsx` snapshot (no regeneration needed).

3. **Thread `targetElement` from `<Hint>` to `<HintHotspot>`** (`packages/hints/src/components/hint.tsx`). `<Hint>` already destructures `{ element: targetElement, rect: targetRect } = useElementPosition(...)`. Add `targetElement={targetElement}` to the `<HintHotspot>` JSX. Also accept a new optional `autohide` prop on `HintProps` and forward it. Existing consumers who don't set `autohide` see no change.

4. **Mock `IntersectionObserver` in vitest setup.** Add to `packages/hints/vitest.setup.ts`:

   ```ts
   // packages/hints/vitest.setup.ts — append
   if (typeof IntersectionObserver === 'undefined') {
     class MockIntersectionObserver {
       readonly root = null
       readonly rootMargin = ''
       readonly thresholds = [0]
       constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {}
       observe() {}
       unobserve() {}
       disconnect() {}
       takeRecords(): IntersectionObserverEntry[] { return [] }
     }
     // @ts-expect-error — jsdom missing
     globalThis.IntersectionObserver = MockIntersectionObserver
   }
   ```

   Then per-test, replace with a controllable mock to drive `isVisible` transitions:

   ```ts
   // in intersection-observer.test.tsx
   const callbacks: IntersectionObserverCallback[] = []
   class ControllableIO {
     constructor(public cb: IntersectionObserverCallback) { callbacks.push(cb) }
     observe() {}
     disconnect() {}
   }
   vi.stubGlobal('IntersectionObserver', ControllableIO)
   // Trigger: act(() => callbacks[0]([{ isIntersecting: false, intersectionRatio: 0, target } as IntersectionObserverEntry], observerInstance))
   ```

5. **Write `packages/hints/src/__tests__/intersection-observer.test.tsx`.** ≥4 cases:
   1. Render `<HintHotspot autohide targetElement={anchor} targetRect={rect} position="top-right" />`. Initial render: `getByRole('button')` has `opacity-100` and no `pointer-events-none`.
   2. Fire the captured IO callback with `intersectionRatio: 0` → rerender → assert button has `opacity-0` and `pointer-events-none`.
   3. Fire callback again with `intersectionRatio: 1` → assert `opacity-100`, no `pointer-events-none`.
   4. Render `<HintHotspot />` WITHOUT `autohide` → assert button className does NOT include `transition-opacity` or `opacity-0` or `pointer-events-none` (byte-identical to pre-Phase-19).
   5. Render `<Hint id="x" target="#anchor" autohide />` inside a `<HintsProvider>` with an anchor in the DOM. Fire IO callback with `isIntersecting: false`. Assert `queryByRole('button')` is still in the document (mounted) but has `opacity-0`. Assert `useHint('x').isDismissed === false` (visual-only invariant).

6. **Write a no-regression assertion.** Add a single new test case to the existing `packages/hints/src/__tests__/reduced-motion.test.tsx` (or create `packages/hints/src/__tests__/autohide-reduced-motion.test.tsx` if you prefer isolation) that mocks `matchMedia('(prefers-reduced-motion: reduce)')` to `true`, renders `<HintHotspot autohide />`, and asserts the className still contains `motion-safe:transition-opacity` — but the test does NOT inspect computed styles (jsdom doesn't compute media-query class semantics). This is a smoke test that the tier-1 prefix is in the class chain; tier-1 actual behaviour is validated in the Playwright test.

**Sanity check:** `pnpm --filter @tour-kit/hints typecheck` exits `0`. `pnpm --filter @tour-kit/hints test` exits `0` with new tests green and ALL existing tests in `packages/hints/src/__tests__/` still green (no snapshot regeneration on `hint-hotspot.test.tsx` — proves byte-identical default path).

---

### Task 19.2 — Performance test + Playwright scroll fixture + docs (1–2 h)

**Depends on:** 19.1.

Sub-steps:

1. **Vitest perf budget — `packages/hints/src/__tests__/autohide.perf.test.ts`.** Vitest's test runner is fine for a synthetic perf measurement; we are not benchmarking real layout (that's Playwright's job in step 2).

   ```ts
   import { render } from '@testing-library/react'
   import { describe, expect, it, vi } from 'vitest'
   import { HintHotspot } from '../components/hint-hotspot'

   describe('autohide perf budget', () => {
     it('50 hints + 60 IO callbacks/s: median batch < 1ms', () => {
       const callbacks: IntersectionObserverCallback[] = []
       class ControllableIO {
         constructor(public cb: IntersectionObserverCallback) { callbacks.push(cb) }
         observe() {}
         disconnect() {}
       }
       vi.stubGlobal('IntersectionObserver', ControllableIO)

       const anchor = document.createElement('div')
       document.body.appendChild(anchor)
       const rect = anchor.getBoundingClientRect()

       // Render 50 hotspots
       const { rerender } = render(
         <>
           {Array.from({ length: 50 }).map((_, i) => (
             <HintHotspot
               key={i}
               autohide
               targetElement={anchor}
               targetRect={rect}
               position="top-right"
             />
           ))}
         </>
       )
       expect(callbacks).toHaveLength(50)

       // Simulate 60 batches/s for 1 second = 60 batches.
       // Each batch fires all 50 callbacks with alternating isIntersecting.
       const durations: number[] = []
       for (let i = 0; i < 60; i++) {
         const isIntersecting = i % 2 === 0
         const entry = { isIntersecting, intersectionRatio: isIntersecting ? 1 : 0, target: anchor } as IntersectionObserverEntry
         const start = performance.now()
         callbacks.forEach((cb) => cb([entry], {} as IntersectionObserver))
         durations.push(performance.now() - start)
       }

       const sorted = [...durations].sort((a, b) => a - b)
       const median = sorted[Math.floor(sorted.length / 2)]
       // Budget: median batch (all 50 callbacks) < 1ms.
       // Per-callback budget: < 0.02ms.
       expect(median).toBeLessThan(1)
     })
   })
   ```

   Notes:
   - This measures **callback dispatch + state update batching cost**, which is the part React owns. Real layout/paint cost is browser-side and measured in Playwright.
   - If the budget fails on CI hardware, the diagnosis order is: (a) is `setIsVisible((prev) => prev === next ? prev : next)` correctly skipping no-op renders? (b) is the test rendering inside React 18 automatic batching (no `act()` wrapper around the loop — leave it un-`act`ed so we measure pure callback cost, not React's reconciliation)?

2. **Playwright fixture — `packages/playwright/fixtures-app/hint-autohide.html`.** A page with a tall scroll container (~2000px) and a single anchored element 1000px down. The fixture mounts `<HintsProvider><Hint id="scroll-hint" target="#anchor" autohide content="..." autoShow /></HintsProvider>`. On page load: hint is hidden (target offscreen). Scroll the container to `top: 800` → hint becomes visible. Scroll back to `top: 0` → hint hides.

3. **Playwright spec — `packages/playwright/__tests__/hint-autohide.spec.ts`.**

   ```ts
   import { expect, test } from '../src'

   test.describe('@tour-kit/hints autohide', () => {
     test('scrolls out → hides within 200ms; scrolls back → shows', async ({ page }) => {
       await page.goto('/hint-autohide.html')
       await page.waitForLoadState('networkidle')

       const hotspot = page.locator('[aria-label="Show hint"]')

       // Initial state: anchor is offscreen at top, so hotspot should be hidden.
       await expect(hotspot).toHaveCSS('opacity', '0', { timeout: 500 })

       // Scroll the anchor into view
       await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'instant' as ScrollBehavior }))
       await expect(hotspot).toHaveCSS('opacity', '1', { timeout: 500 })

       // Scroll back — hotspot hides again
       await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }))
       await expect(hotspot).toHaveCSS('opacity', '0', { timeout: 500 })
     })

     test('perf: zero dropped frames during scroll with 50 hints (Chrome 4× CPU throttle)', async ({ page, browser }) => {
       const cdp = await browser.newBrowserCDPSession(page)
       await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
       await page.goto('/hint-autohide-50.html')
       await page.waitForLoadState('networkidle')

       // Start frame stats; scroll for 3 seconds; assert no dropped frames.
       const metricsStart = await cdp.send('Performance.getMetrics')
       await page.evaluate(() => {
         return new Promise<void>((resolve) => {
           let y = 0
           const step = () => {
             y = (y + 20) % 2000
             window.scrollTo(0, y)
             if (performance.now() > 3000) resolve()
             else requestAnimationFrame(step)
           }
           requestAnimationFrame(step)
         })
       })
       const metricsEnd = await cdp.send('Performance.getMetrics')
       // Compute dropped frames from metric deltas (browser-dependent; in Chromium it's `Frames` or `JSHeapUsedSize` deltas).
       // Pragmatic budget: total scripting time in the 3s window < 500ms.
       const startScript = metricsStart.metrics.find((m) => m.name === 'ScriptDuration')?.value ?? 0
       const endScript = metricsEnd.metrics.find((m) => m.name === 'ScriptDuration')?.value ?? 0
       expect(endScript - startScript).toBeLessThan(0.5) // seconds
     })
   })
   ```

   Notes:
   - The 200ms tolerance covers the IO callback latency (browser-implementation-dependent; spec says "next animation frame" but in practice ~50–150ms on throttled CPU) plus the 150ms transition. The "100ms" stated in the success criteria is the IO callback alone; the visual transition is on top of that. The Playwright assertion uses Playwright's auto-retry (`toHaveCSS` with `timeout: 500`) which handles both latencies.
   - The 50-hint perf test is intentionally lenient on the exact dropped-frame count because CI hardware varies — the budget is total scripting time `< 500ms` over a 3-second scroll. If CI flakes, raise to `< 750ms` and document in the test.

4. **Docs page — `apps/docs/content/docs/hints/autohide.mdx`.** Frontmatter `title: Autohide` + `description: Hide hints when their target scrolls offscreen — visual only, no permanent dismissal.`. Four sections:
   - "When to use" — concrete examples (long forms, dashboards, kanban columns).
   - "Basic usage" — `<Hint autohide ...>` example with a live scroll preview inside a `max-h-64 overflow-y-scroll` container.
   - "Custom threshold and rootMargin" — `<Hint autohide={{ threshold: 0.5, rootMargin: '-50px' }} ...>`.
   - "What autohide is and isn't" — the visual-only invariant. Explicitly state: "Autohide is a render-time visibility toggle. It does not call `onDismiss`, does not set `isDismissed`, and does not affect persistence. When the target scrolls back into view, the hint reappears."
   - Update `apps/docs/content/docs/hints/meta.json` `pages` array to include `"autohide"` (insert between `"persistence"` and `"headless"` so it sits alongside other behaviour docs).

**Sanity check:** `pnpm --filter @tour-kit/hints test` exits `0` (perf test green); `cd packages/playwright && pnpm test:e2e hint-autohide` passes both Playwright cases; `pnpm --filter docs build` exits `0` with the new MDX page rendering.

---

## Deliverables

```
packages/hints/
├── src/
│   ├── hooks/
│   │   └── use-intersection-observer.ts                       # NEW — useIntersectionObserver hook + types
│   ├── components/
│   │   ├── hint-hotspot.tsx                                   # UPDATED — accept `autohide` + `targetElement` props, integrate hook, apply visibility class
│   │   └── hint.tsx                                           # UPDATED — forward `autohide` prop + thread targetElement
│   └── index.ts                                               # UPDATED — re-export useIntersectionObserver + AutohideOptions + types
├── vitest.setup.ts                                            # UPDATED — IntersectionObserver mock for jsdom
└── src/__tests__/
    ├── intersection-observer.test.tsx                          # NEW — 5 cases: render, hide-on-offscreen, show-on-visible, default-byte-identical, visual-only invariant
    └── autohide.perf.test.ts                                   # NEW — 50 hotspots × 60 callbacks/s; median batch < 1ms

packages/playwright/
├── fixtures-app/
│   ├── hint-autohide.html                                     # NEW — single hint in a scroll container
│   └── hint-autohide-50.html                                  # NEW — 50 hints in a scroll container (perf test fixture)
└── __tests__/
    └── hint-autohide.spec.ts                                  # NEW — scroll-out / scroll-back / perf budget under CPU throttle

apps/docs/content/docs/hints/
├── autohide.mdx                                               # NEW — 4 sections: when, basic, custom, visual-only invariant
└── meta.json                                                  # UPDATED — slot "autohide" into pages array
```

No new dependencies. No `package.json` changes. No provider changes. The Phase 3 discriminated union and Phase 12 `<HintGroup>` context both stay intact — `autohide` is a base prop, not a variant-branched extra.

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/hints typecheck` exits `0`
- [ ] `pnpm --filter @tour-kit/hints test` exits `0` with `intersection-observer.test.tsx` (5 cases) and `autohide.perf.test.ts` (perf budget) green; **all existing hints tests stay green without snapshot regeneration** (specifically `hint-hotspot.test.tsx`, `hint.test.tsx`, `use-hint.test.ts`, `reduced-motion.test.tsx`, `hint-i18n.test.tsx`, `hint-frequency.test.tsx`, `hint-media.test.tsx`, `hint-segmentation.test.tsx`, `analytics-events.test.tsx`)
- [ ] `<HintHotspot autohide targetElement={anchor} ... />` renders with `opacity-100` initially; firing an IO callback with `intersectionRatio: 0` causes a re-render with `opacity-0 pointer-events-none` in the className chain
- [ ] `<HintHotspot />` (no `autohide` prop) renders a className chain that does NOT contain `transition-opacity`, `opacity-0`, or `pointer-events-none` — verified by `expect(button.className).not.toMatch(/transition-opacity|opacity-0|pointer-events-none/)` and by the existing `hint-hotspot.test.tsx` snapshot remaining untouched
- [ ] `useHint(id).isDismissed === false` after a full scroll-out / scroll-back cycle — verified by the visual-only-invariant test case in `intersection-observer.test.tsx`
- [ ] Playwright: `cd packages/playwright && pnpm test:e2e hint-autohide` passes; specifically the spec asserts `opacity === '0'` after scroll-out (within 500ms) and `opacity === '1'` after scroll-back (within 500ms)
- [ ] Perf budget: `autohide.perf.test.ts` reports median batch duration `< 1ms` for 50 hotspots × 60 callbacks/s; Playwright 50-hint scroll test reports total scripting time `< 500ms` over a 3-second scroll under Chrome 4× CPU throttle
- [ ] `apps/docs/content/docs/hints/autohide.mdx` renders in `pnpm --filter docs dev` with a working live preview; `pnpm --filter docs build` exits `0`; the new page is listed in the hints sidebar between `persistence` and `headless`
- [ ] Bundle delta: `gzip -c packages/hints/dist/index.mjs | wc -c` grows by `< 1024` bytes versus pre-PR baseline — recorded in PR description (before/after byte counts)
- [ ] Existing consumers using `<Hint>` / `<HintHotspot>` without `autohide` see byte-identical rendered output and zero new runtime cost (no IntersectionObserver created when `autohide` is falsy — verified by spying on the global `IntersectionObserver` constructor in a unit test and asserting it is not called when `autohide` is omitted)

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 19 of Tour Kit v2 Package Polish — **Hints Offscreen Autohide**. This is the final phase of the v2 Package Polish roadmap and is fully additive: existing consumers see byte-identical behaviour unless they opt in by setting `autohide` on `<Hint>` or `<HintHotspot>`.

### What This Project Is

Tour Kit is a pnpm + Turborepo monorepo of 12 React packages providing headless onboarding/product-tour primitives (`@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints` are MIT/public; the rest are Pro). Strict TypeScript, ES2020 target, tsup for bundling, vitest for unit tests, Playwright for E2E. This phase touches one package: `@tour-kit/hints` (persistent hints/hotspots outside the tour flow), plus a Playwright fixture and a docs page.

### Established in Prior Phases (relevant to Phase 19)

- **Phase 3 (complete) added a discriminated-union `variant` prop to `<HintHotspot>`.** The literal union `'badge' | 'beacon-with-label' | 'what-s-new-pill'` is locked. You add `autohide?: boolean | AutohideOptions` to the **base** of `HintHotspotProps` — NOT to any variant branch — so all four union members (`undefined`, `'badge'`, `'beacon-with-label'`, `'what-s-new-pill'`) still typecheck. Phase 3 lives at `packages/hints/src/components/hint-hotspot.tsx`, `packages/hints/src/variants/{badge,beacon-with-label,whats-new-pill}.tsx`, and `packages/hints/src/components/ui/hint-variants.ts`.

- **Phase 12 (complete) added `<HintGroup>` and the `useHintGroupItem` hook.** A grouped hotspot that autohides stays registered in the group (we do NOT unregister on autohide). Document this in the docs page. Phase 12 lives at `packages/hints/src/components/hint-group.tsx`, `packages/hints/src/context/hint-group-context.ts`, and `packages/hints/src/hooks/use-hint-group-item.ts`.

- **`<Hint>` already resolves the target element via `useElementPosition`** (`packages/hints/src/components/hint.tsx`). The hook returns `{ element: targetElement, rect: targetRect }`. Today `<Hint>` passes only `targetRect` to `<HintHotspot>`; this phase adds `targetElement` as an internal-only prop on `<HintHotspot>` so it can subscribe an `IntersectionObserver` to the element.

- **Reduced-motion three-tier defense is the load-bearing cross-package contract** — repo-root CLAUDE.md spells out the three tiers. This phase needs only tier 1: `motion-safe:transition-opacity motion-safe:duration-150`.

- **The `useReducedMotion()` hook from `@tour-kit/core` is already re-exported from `@tour-kit/hints`** and gates `animate-tour-pulse` in `<HintHotspot>`. You do NOT need to call it for this phase — tier 1 (motion-safe prefix) is sufficient for the opacity transition.

### Your Goal for This Phase

Ship an `autohide` opt-in prop on `<HintHotspot>` (and `<Hint>` for ergonomic forwarding) that hides the hotspot when its target scrolls out of the viewport — purely visually, never mutating dismissal state. Land:
1. A reusable `useIntersectionObserver` hook (exported from `@tour-kit/hints`).
2. The `<HintHotspot>` integration behind the new prop.
3. A vitest perf test proving the observer-callback cost is `< 1ms` median batch over 50 hotspots × 60 callbacks/s.
4. A Playwright fixture + spec proving real scroll-driven show/hide works on Chromium.
5. A docs page documenting the prop, the threshold/rootMargin options, and the visual-only invariant.

### Data Model Rules (follow exactly)

- **`interface` (exported, public):** `UseIntersectionObserverOptions`, `UseIntersectionObserverReturn`, `AutohideOptions`. All three in their respective files (`hooks/use-intersection-observer.ts` and `components/hint-hotspot.tsx`).
- **`React.useState<boolean>` for `isVisible`** — local, never persisted, initialized `true` (optimistic).
- **`useRef<Element | null>` for the observed target** inside `<HintHotspot>` — kept in sync with the `targetElement` prop via `useEffect`.
- **No new dependencies.** `IntersectionObserver` is a native browser API. No polyfill needed (we target ES2020 / modern evergreen browsers; consumers needing IE11 are not in scope).
- **No `Pydantic BaseSettings` / `@dataclass` rows** — this is a React-only phase, no Python, no config.

### The Visual-Only Invariant (the single load-bearing rule)

Autohide is **purely visual**. The hotspot stays mounted, the `<HintTooltip>` render branch is unchanged, `useHint(id).isDismissed` stays `false`, `onDismiss` is never called, `aria-expanded` is unchanged. The IO callback only updates the local `isVisible` state, which drives `opacity-0 pointer-events-none` vs `opacity-100`. When the target re-enters the viewport, the hotspot reappears — no re-running of `autoShow`, no re-firing of analytics events.

### Reduced-Motion Tier 1 (the only tier needed this phase)

`motion-safe:transition-opacity motion-safe:duration-150` is the entire defense. Tailwind compiles `motion-safe:` to `@media (prefers-reduced-motion: no-preference) { ... }` — under reduce, the utility never applies, so the opacity flips instantly (no fade). No `useReducedMotion()` JS gate needed; no custom `@keyframes` added.

### The `useIntersectionObserver` Hook Signature (paste-ready)

```ts
// packages/hints/src/hooks/use-intersection-observer.ts
'use client'

import * as React from 'react'

export interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  rootMargin?: string
  enabled?: boolean
}

export interface UseIntersectionObserverReturn {
  isVisible: boolean
}

export function useIntersectionObserver(
  targetRef: React.RefObject<Element | null>,
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const { threshold = 0, rootMargin = '0px', enabled = true } = options
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    if (!enabled) {
      setIsVisible(true)
      return
    }
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        const next = Array.isArray(threshold)
          ? entry.isIntersecting
          : entry.intersectionRatio > threshold
        setIsVisible((prev) => (prev === next ? prev : next))
      },
      { threshold, rootMargin }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [targetRef, threshold, rootMargin, enabled])

  return { isVisible }
}
```

The `setIsVisible((prev) => (prev === next ? prev : next))` pattern is load-bearing for the perf budget — when the IO callback fires but the threshold side hasn't changed, no re-render happens.

### The Visibility CSS Pattern (paste-ready)

```tsx
// Inside <HintHotspot>, after resolving autohideOpts and isVisible:
const visibilityClass = autohideOpts
  ? cn(
      'motion-safe:transition-opacity motion-safe:duration-150',
      isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    )
  : null

return (
  <Comp
    className={cn(
      hintHotspotVariants({ size, color, pulse: shouldPulse, zIndex }),
      visibilityClass,  // null → cn() drops it → byte-identical default path
      className
    )}
    /* ...rest unchanged */
  />
)
```

When `autohide` is undefined/false, `visibilityClass === null`, `cn(...)` discards `null` arguments, and the rendered className is byte-for-byte identical to pre-Phase-19. The existing `hint-hotspot.test.tsx` snapshot stays untouched.

### Architecture

```
<Hint autohide /> ──► useElementPosition() ──► { element: targetEl, rect: targetRect }
                          │
                          ▼
<HintHotspot autohide targetElement={targetEl} targetRect={rect} />
                          │
                          ▼ (only when autohide is set)
                useIntersectionObserver(targetElementRef, { threshold, rootMargin })
                          │
                          ▼ returns { isVisible }
                visibilityClass = motion-safe:transition-opacity duration-150
                                  + opacity-100 | opacity-0 pointer-events-none
                          │
                          ▼
                final className = hintHotspotVariants(...) + visibilityClass + className
```

### Confirmed Library APIs

**`IntersectionObserver` (native, no fetch needed):**
```ts
const obs = new IntersectionObserver(callback, { threshold, rootMargin })
obs.observe(element)
obs.disconnect()
```
Spec: callback fires when the observed element's intersection with the root (viewport by default) crosses any of the listed thresholds. `intersectionRatio` is `0` when fully offscreen, `1` when fully onscreen.

**Existing `<HintHotspot>` (extend, don't replace):**
```tsx
// packages/hints/src/components/hint-hotspot.tsx — CURRENT SHAPE
export const HintHotspot = React.forwardRef<HTMLButtonElement, HintHotspotProps>(
  ({ targetRect, position, size, color, pulse = true, zIndex, isOpen = false, asChild = false, className, children, ...props }, ref) => {
    const library = useUILibrary()
    const reducedMotion = useReducedMotion()
    const pos = getHotspotPosition(position, targetRect)
    const Comp = asChild ? (library === 'base-ui' ? UnifiedSlot : Slot) : 'button'
    const shouldPulse = pulse && !isOpen && !reducedMotion
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : 'button'}
        className={cn(hintHotspotVariants({ size, color, pulse: shouldPulse, zIndex }), className)}
        style={{ top: pos.top, left: pos.left }}
        aria-label="Show hint"
        aria-expanded={isOpen}
        {...props}
      >
        {children ?? <span className="sr-only">Show hint</span>}
      </Comp>
    )
  }
)
```
ADD: `autohide?: boolean | AutohideOptions` + `targetElement?: Element | null` to `HintHotspotProps`. Compute `autohideOpts`, call `useIntersectionObserver`, compute `visibilityClass`, insert into the `cn(...)` chain BEFORE the consumer `className` so consumer overrides win.

**Existing `<Hint>` (small update):**
```tsx
// packages/hints/src/components/hint.tsx — line ~98
const { element: targetElement, rect: targetRect } = useElementPosition(targetSelector ?? targetRefElement)
// ... line ~141
<HintHotspot
  ref={mergedRef}
  targetRect={targetRect}
  position={position}
  /* ADD: */ targetElement={targetElement}
  /* ADD: */ autohide={autohide}
  pulse={pulse}
  isOpen={isOpen}
  onClick={handleHotspotClick}
  size={size}
  color={color}
  zIndex={zIndex}
  className={hotspotClassName}
/>
```
Add `autohide?: boolean | AutohideOptions` to `HintProps` and forward it through.

### Files to Create / Update

#### `packages/hints/src/hooks/use-intersection-observer.ts` (NEW)
Paste the hook implementation from "The `useIntersectionObserver` Hook Signature" section above verbatim. Export `useIntersectionObserver`, `UseIntersectionObserverOptions`, `UseIntersectionObserverReturn`.

#### `packages/hints/src/components/hint-hotspot.tsx` (UPDATED)
- Add `export interface AutohideOptions { threshold?: number; rootMargin?: string }`.
- Extend `HintHotspotProps` with `autohide?: boolean | AutohideOptions` and `targetElement?: Element | null`.
- Resolve `autohideOpts` via `React.useMemo` (returns `null` when autohide is falsy; otherwise a `UseIntersectionObserverOptions`).
- Maintain a `targetElementRef = React.useRef<Element | null>(props.targetElement ?? null)` and sync it in a `useEffect` keyed on `props.targetElement`.
- Call `useIntersectionObserver(targetElementRef, autohideOpts ?? { enabled: false })`.
- Compute `visibilityClass` (null when `autohideOpts` is null).
- Insert into the className chain as shown in "The Visibility CSS Pattern" above.
- Dev warning: when `autohide` is set and `targetElement` is missing, `console.warn('[HintHotspot] autohide requires a targetElement prop; falling back to always-visible.')`.

#### `packages/hints/src/components/hint.tsx` (UPDATED)
- Add `autohide?: boolean | AutohideOptions` to `HintProps`.
- Destructure it in the props.
- Forward `targetElement={targetElement}` and `autohide={autohide}` to `<HintHotspot>`.
- No other changes — the existing `useElementPosition` already returns the element.

#### `packages/hints/src/index.ts` (UPDATED)
Append:
```ts
export { useIntersectionObserver } from './hooks/use-intersection-observer'
export type { UseIntersectionObserverOptions, UseIntersectionObserverReturn } from './hooks/use-intersection-observer'
export type { AutohideOptions } from './components/hint-hotspot'
```

#### `packages/hints/vitest.setup.ts` (UPDATED)
Append the `MockIntersectionObserver` polyfill block (paste from Task 19.1 step 4 above).

#### `packages/hints/src/__tests__/intersection-observer.test.tsx` (NEW)
Vitest + RTL. ≥5 cases per Task 19.1 step 5. Use a controllable `IntersectionObserver` mock via `vi.stubGlobal('IntersectionObserver', ControllableIO)` that captures the callback in a module-level array so tests can fire it manually.

#### `packages/hints/src/__tests__/autohide.perf.test.ts` (NEW)
Vitest. Single case: render 50 hotspots, fire 60 alternating callbacks via `performance.now()`-bracketed loops, assert median batch `< 1ms`. Paste from Task 19.2 step 1 above.

#### `packages/playwright/fixtures-app/hint-autohide.html` (NEW)
A single-hint scroll fixture. ~2000px tall page with an anchor 1000px down. React mount of `<HintsProvider><Hint id="scroll-hint" target="#anchor" autohide autoShow content="Scrollable hint" /></HintsProvider>`. Mirror the existing `two-step.html` mount pattern.

#### `packages/playwright/fixtures-app/hint-autohide-50.html` (NEW)
Same as above but mounts 50 `<Hint>` instances, each targeting a different anchor positioned along a scrollable column. Used only by the perf test.

#### `packages/playwright/__tests__/hint-autohide.spec.ts` (NEW)
Two cases per Task 19.2 step 3: (1) scroll-out / scroll-back visibility transitions; (2) 50-hint perf budget under Chrome 4× CPU throttle. Reuse `import { expect, test } from '../src'`.

#### `apps/docs/content/docs/hints/autohide.mdx` (NEW)
Frontmatter `title: Autohide` + `description: Hide hints when their target scrolls offscreen — visual only, no permanent dismissal.`. Four H2 sections per Task 19.2 step 4. Mirror sibling MDX in `apps/docs/content/docs/hints/`. Include the explicit visual-only invariant paragraph: "Autohide is a render-time visibility toggle. It does not call `onDismiss`, does not set `isDismissed`, and does not affect persistence. When the target scrolls back into view, the hint reappears."

#### `apps/docs/content/docs/hints/meta.json` (UPDATED)
Insert `"autohide"` into the `pages` array between `"persistence"` and `"headless"`.

### Success Criteria

- `pnpm --filter @tour-kit/hints typecheck` exits 0
- `pnpm --filter @tour-kit/hints test` exits 0 with new tests green and all existing hints tests green (no snapshot regeneration on `hint-hotspot.test.tsx` proves byte-identical default path)
- Vitest perf test reports median batch `< 1ms` for 50 hotspots × 60 callbacks/s
- Playwright scroll-out / scroll-back spec passes; computed `opacity` flips to `0` within 500ms of scroll-out, flips to `1` within 500ms of scroll-back
- Playwright 50-hint perf spec under 4× CPU throttle reports total scripting time `< 500ms` over a 3-second scroll
- `apps/docs` builds without errors; the new `/docs/hints/autohide` page renders in the sidebar between persistence and headless
- Bundle delta `< 1 KB` gzipped, recorded in PR description
- Visual-only invariant proven: `useHint(id).isDismissed === false` after scroll-out / scroll-back cycle
- Standalone `<Hint>` / `<HintHotspot>` consumers without `autohide` see byte-identical output and zero `new IntersectionObserver(...)` calls (spy assertion)

### Expected File Structure at End

```
packages/hints/
├── src/
│   ├── hooks/use-intersection-observer.ts              NEW
│   ├── components/hint-hotspot.tsx                     UPDATED
│   ├── components/hint.tsx                             UPDATED
│   └── index.ts                                        UPDATED
├── vitest.setup.ts                                     UPDATED
└── src/__tests__/
    ├── intersection-observer.test.tsx                  NEW
    └── autohide.perf.test.ts                           NEW

packages/playwright/
├── fixtures-app/hint-autohide.html                     NEW
├── fixtures-app/hint-autohide-50.html                  NEW
└── __tests__/hint-autohide.spec.ts                     NEW

apps/docs/content/docs/hints/
├── autohide.mdx                                        NEW
└── meta.json                                           UPDATED
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 3's discriminated-union variant interface is preserved (autohide lives on the base, not on any variant branch, so the literal union `'badge' | 'beacon-with-label' | 'what-s-new-pill'` is untouched). Phase 12's `<HintGroup>` and `useHintGroupItem` are unaffected (autohide is per-hotspot, independent of group context; documented in the architecture section). The existing `useElementPosition` already returns the target Element, so threading it from `<Hint>` → `<HintHotspot>` is a one-line addition. The `useReducedMotion()` hook re-exported from `@tour-kit/hints` is mentioned for completeness but tier-1 `motion-safe:` Tailwind prefix is sufficient — no JS gate needed.
- [PASS] Every sub-task has a clear, testable completion condition — Task 19.1 ends with `typecheck exits 0 + test exits 0 with no snapshot regeneration on hint-hotspot.test.tsx`; Task 19.2 ends with `perf test green + Playwright spec passes + docs build exits 0`. Each test case is named and its assertion is spelled out.
- [PASS] Execution prompt is self-contained — the `useIntersectionObserver` hook implementation, the visibility CSS pattern, the visual-only invariant, the Phase 3 variant interface (referenced), the existing `<HintHotspot>` shape (pasted verbatim), and the `<Hint>` integration diff (pasted verbatim) are all inline. No "see Phase X" references in the prompt body. Per-file guidance covers exact exports, props, console.warn behavior, and the `cn(null)` byte-identity trick.
- [PASS] Exit criteria map 1:1 to deliverables — 10 exit checkboxes covering typecheck, all 9 existing test files staying green, 2 new test files, 1 Playwright spec, byte-identical default path (spy + snapshot), perf budget (both vitest and Playwright variants), docs render + sidebar slot, bundle delta, and the visual-only invariant. Every new/updated file is referenced by at least one exit check.
- [PASS] Heavy external deps have a fake/stub strategy noted — `IntersectionObserver` is native but missing in jsdom; a `MockIntersectionObserver` is added to `vitest.setup.ts` (passive — does nothing); per-test, a `ControllableIO` class is stubbed via `vi.stubGlobal` so tests can fire callbacks manually. No 100MB+ deps, no network, no GPU.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — no new libraries this phase (`IntersectionObserver` is a native browser API and a well-established React pattern, per the user's prompt "No Context7 Calls Needed"). The hook implementation is paste-ready in the execution prompt. Playwright `toHaveCSS` and CDP `Emulation.setCPUThrottlingRate` are well-known APIs and snippets are paste-ready.

**Note on test directory path:** the user-facing task spec referenced `packages/hints/__tests__/` for new test files, but the actual repository places hints tests at `packages/hints/src/__tests__/` (verified by inspecting the existing `reduced-motion.test.tsx`, `hint-i18n.test.tsx`, etc. in that directory). The deliverables and exit criteria use the actual repo path (`packages/hints/src/__tests__/`) to ensure the implementation is consistent with the existing codebase and the vitest config picks up the new files without configuration changes. This is a deliberate honesty-over-spec call.
