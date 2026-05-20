# Phase 6 — Checklist Imperative + Completion Celebration

**Duration:** Days 30–34 (~7–10 hours)
**Depends on:** Nothing (parallelizable with Phases 1–5)
**Blocks:** Nothing directly. Feeds the M4 milestone gate ("checklist UX parity with Userpilot/Appcues — externally driveable + celebrated").
**Risk Level:** MEDIUM — APIs are additive (`forwardRef` already exists on `ChecklistLauncher`; we extend its ref payload via `useImperativeHandle`, plus a brand-new `<ChecklistCompletion>` component). The canvas-confetti dependency is the load-bearing risk: it must be peer-optional so consumers who only want the static checkmark never pay the ~4 KB gzipped weight, and the confetti must respect `prefers-reduced-motion` on every render path (CLAUDE.md three-tier defense).
**Stack:** react

---

## Objective

Close two checklist-UX gaps that consumers hit on day one:

1. **Imperative control on `<ChecklistLauncher>`.** Today the launcher is a self-managed open/close button — there is no way to open it from a "Need help?" link in the navbar, a help-menu item, or a tour step's `onComplete`. We expose `{ open(), close(), toggle() }` via `useImperativeHandle` so a parent can hold a `ChecklistLauncherRef` and drive the panel without simulating clicks.
2. **`<ChecklistCompletion>` celebration.** When the last task flips to complete, fire a one-shot celebration: confetti (canvas), a static check-mark badge, or no-op. Honors `prefers-reduced-motion: reduce` via the three-tier defense — under reduce, even `variant="confetti"` falls back to the static badge so Lighthouse a11y stays 100.

Both APIs land in `@tour-kit/checklists` as additive surface — existing consumers (no `ref`, no `<ChecklistCompletion>` mounted) see byte-identical behaviour. `canvas-confetti` is an **optional** peer (`peerDependenciesMeta.optional`) loaded via `await import()` only when `variant="confetti"` actually runs and reduced-motion is false. The completion-detection signal is component-local (`previousCompleteRef` + `hasFiredRef`) and deliberately independent of the provider's existing `state.notifiedComplete` set in `checklist-provider.tsx` (lines 414–431), which remains reserved for `config.onComplete` callbacks.

## What Success Looks Like

1. `launcherRef.current?.open()` opens the panel from a sibling subtree without simulating a DOM click — verified by a Vitest test that calls `ref.current.open()` and asserts `getByRole('dialog', { name: /checklist/i })` is in the document
2. `launcherRef.current?.toggle()` flips between open and closed on consecutive calls — verified by a Vitest test that calls `toggle()` twice and asserts open → closed
3. `<ChecklistCompletion checklistId="onboarding" variant="confetti">` fires `canvas-confetti` exactly once per mount when the last task transitions from `total - 1` complete to `total` complete — verified by a state-machine test that primes `total - 1` complete tasks, completes the last task, asserts the confetti spy was called exactly once
4. Re-complete is idempotent within a mounted `<ChecklistCompletion>` instance: after the celebration fires once, completing the same checklist again (e.g., user resets and re-completes in the same tab) does NOT re-fire until the component is unmounted and remounted — gated by the hook's component-local `hasFiredRef`, not the provider's `state.notifiedComplete` set
5. Under `prefers-reduced-motion: reduce` (mocked via `useReducedMotion → true`), `variant="confetti"` renders the static "Done!" badge — no `<canvas>` element appears in the DOM, `canvas-confetti` is never imported (dynamic import is short-circuited), and a Lighthouse a11y scan on a story page hosting the celebration reports 100
6. `variant="checkmark"` renders a static SVG check + "Done!" label regardless of motion preference; `variant="none"` renders nothing (used by consumers who track completion via `onComplete` only) — both verified by Vitest snapshots
7. `pnpm --filter @tour-kit/checklists typecheck` exits 0 and `pnpm --filter @tour-kit/checklists test` exits 0 with new tests green
8. `apps/docs/content/docs/checklists/imperative-api.mdx` renders in `pnpm --filter @tour-kit/docs dev` and is listed in the checklists sidebar; the page has runnable code blocks for both the imperative ref API and each celebration variant

---

## Architecture / Key Design Decisions

```
<ChecklistLauncher ref={launcherRef} checklistId="onboarding">  ──┐
   useImperativeHandle(ref, () => ({ open(), close(), toggle() })) │
   internal: const [isOpen, setIsOpen] = useState(false)            │   imperative open/close from anywhere
                                                                    │   without simulating DOM clicks
                                                                    ▼
                                  parent holds ChecklistLauncherRef
                                  e.g., <button onClick={() => launcherRef.current?.open()}>

<ChecklistCompletion checklistId="onboarding" variant="confetti"> ──┐
   useChecklistCelebration(id) → { shouldFire, hasCelebrated }       │
       └─► reads ctx.getChecklist(id).isComplete + ctx.getProgress  │
           internal ref<boolean> previousComplete                    │
           shouldFire true exactly on the false→true edge            │
                                                                    │
   useReducedMotion() → boolean   ◄── tier 3 JS gate                 │
       └─► if reducedMotion → render static "Done!" badge            │
       └─► else if variant === 'confetti' → dynamic import +        │
                                            fire canvas-confetti     │
       └─► else if variant === 'checkmark' → render static SVG      │
       └─► else if variant === 'none' → return null                 ▼
```

### Imperative ref shape (the public contract — locks this phase)

```ts
// packages/checklists/src/components/checklist-launcher.tsx
export interface ChecklistLauncherRef {
  /** Open the checklist panel. Idempotent — calling on already-open is a no-op. */
  open(): void
  /** Close the checklist panel. Idempotent. */
  close(): void
  /** Toggle the panel open state. */
  toggle(): void
}

export const ChecklistLauncher = React.forwardRef<
  ChecklistLauncherRef,
  ChecklistLauncherProps
>((props, ref) => { /* ... */ })
```

> **Breaking-ish change to the ref:** today the component is `forwardRef<HTMLButtonElement, ChecklistLauncherProps>` (line 60 of `checklist-launcher.tsx`). We are widening the ref payload from a DOM element to the imperative handle. Consumers passing a `useRef<HTMLButtonElement>` to grab the button (e.g., for focus) will see a TS error. **Mitigation:** keep `mergedRef` wiring the button DOM node through to `props.buttonRef?: React.Ref<HTMLButtonElement>` — a new optional prop — so the underlying button is still reachable when needed. Document in CHANGELOG as a typed-ref refactor with a one-line codemod fix (`ref={x}` → `buttonRef={x}` for consumers who want the DOM node).

### Completion celebration component contract

```ts
// packages/checklists/src/components/checklist-completion.tsx
export type ChecklistCompletionVariant = 'confetti' | 'checkmark' | 'none'

export interface ChecklistCompletionProps {
  /** Checklist ID to watch for completion. */
  checklistId: string
  /** Celebration style. Defaults to 'checkmark' so first-time consumers get something visible without adding deps. */
  variant?: ChecklistCompletionVariant
  /** Label shown on the static badge (both checkmark variant and reduced-motion fallback). Default: "Done!" */
  label?: string
  /** Optional callback fired once when the celebration triggers. */
  onCelebrate?: () => void
  /** Override className on the badge. */
  className?: string
}
```

### Reduced-motion three-tier defense (per repo-root CLAUDE.md)

| Tier | Mechanism | Where it applies in this phase |
|---|---|---|
| 1 | `motion-safe:` Tailwind prefix on `tailwindcss-animate` utilities | The static badge uses `motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:fade-in motion-safe:duration-200` on initial mount so users see a soft pop. Under reduce, the badge appears with no animation. |
| 2 | `@media (prefers-reduced-motion: reduce)` wrapper around custom `@keyframes` | If we add a `tk-celebrate-pulse` keyframe to `packages/checklists/src/styles/animations.css`, wrap it in `@media (prefers-reduced-motion: reduce) { animation: none; }` — mirrors the existing `tk-fade-completed` / `tk-check-pop` block at lines 49–54. **For Phase 6 we lean on existing tailwindcss-animate utilities** so no new keyframes are needed; if review pushes back on the badge feeling flat, add the keyframe inside this tier-2 wrapper. |
| 3 | JS gate via `useReducedMotion()` from `@tour-kit/core` | **Load-bearing:** `if (reducedMotion) → render static badge` is the only thing standing between a reduce-motion user and a fullscreen canvas. Branch first, render second. Also gates the dynamic `await import('canvas-confetti')` — under reduce, the import never happens, so consumers on reduce never pay the 4 KB cost. |

> **`useReducedMotion` re-export.** Checklists currently imports `useReducedMotion` from `@tour-kit/core` directly (`packages/checklists/src/components/checklist-task.tsx:3`). The `announcements`, `surveys`, and `hints` packages re-export it for ergonomics (CLAUDE.md cross-package section). This phase **adds the re-export** to `packages/checklists/src/index.ts` so `<ChecklistCompletion>` consumers can `import { useReducedMotion } from '@tour-kit/checklists'` instead of pulling core. Sub-task of 6.2.

### Library decision — `canvas-confetti` vs hand-rolled canvas RAF

**Decision: use `canvas-confetti` as an optional peer dep with dynamic import.**

Rationale:
- **Bundle cost is zero when unused.** Consumers who pick `variant="checkmark"` or `variant="none"` (or who don't mount `<ChecklistCompletion>` at all) never load it. The `await import('canvas-confetti')` is gated behind `variant === 'confetti' && !reducedMotion` AND wrapped in `try/catch` so a missing peer falls back to the static badge with a one-time `console.warn`.
- **canvas-confetti gzipped weight is ~4 KB** — small, no transitive deps, MIT licensed, High source reputation on Context7.
- **Built-in `disableForReducedMotion: true` option** is a defense-in-depth layer below our own tier-3 JS gate — even if our gate somehow misfires (consumer overrides `useReducedMotion`), the library still respects the OS pref.
- **Hand-rolling** a 30-particle canvas RAF with gravity + decay would be 80–120 LOC of new code we'd need to maintain and unit-test ourselves — net negative vs a 4 KB optional dep with `disableForReducedMotion` baked in. We'd also need to ship a `<canvas>` cleanup on unmount, which is non-trivial under StrictMode double-mount.

Peer dep wiring:
```jsonc
// packages/checklists/package.json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "@mui/base": "^5.0.0-beta.0",
    "canvas-confetti": "^1.9.0"
  },
  "peerDependenciesMeta": {
    "@mui/base": { "optional": true },
    "canvas-confetti": { "optional": true }
  },
  "devDependencies": {
    "canvas-confetti": "^1.9.0",
    "@types/canvas-confetti": "^1.6.4"
    // ...existing
  }
}
```

Tests pin to the workspace devDep so the dynamic import resolves in jsdom; production consumers install it themselves when they want confetti.

### Data Model Strategy

| Layer | Type | Why |
|---|---|---|
| Public ref (`ChecklistLauncherRef`) | `interface` exported from `packages/checklists/src/components/checklist-launcher.tsx` | Consumers extend it (e.g., parent components composing the launcher); `interface` is the project convention for public types |
| `ChecklistCompletionProps` | `interface` exported | Same — consumers may want to wrap it |
| `ChecklistCompletionVariant` | `type` (literal union) | A `type` is the project convention for closed literal unions; not extensible |
| `useChecklistCelebration` return | `{ shouldFire: boolean; hasCelebrated: boolean }` | `shouldFire` triggers side effects on the edge; `hasCelebrated` keeps the static badge visible after the edge until unmount |
| `previousComplete` tracking | `React.useRef<boolean>` (component-local) | Edge detection without re-renders; reset on unmount means re-mount can fire once more |
| Confetti import handle | `React.useRef<typeof import('canvas-confetti') | null>` | Cached after first dynamic import so re-celebrations in the same session don't re-import |

**Other critical rules for this phase:**

- **No new context, no new provider.** `useChecklistCelebration(id)` is a hook that reads from the existing `useChecklistContext()` — never introduce a `CelebrationProvider`.
- **One-shot per mount.** The celebration must not fire on every re-render where `isComplete === true`. The edge `prev=false && now=true` is the only trigger. After firing once, `previousComplete.current = true` and stays there until unmount. This is intentional: a consumer who wants the celebration to re-fire after a reset must unmount + remount the component (e.g., by `key`ing it on a session id).
- **The provider already gates `onComplete` with `notifiedComplete`.** Lines 414–431 of `checklist-provider.tsx` track which checklists have already notified — `<ChecklistCompletion>` does NOT replicate that gate (the provider's `MARK_NOTIFIED_COMPLETE` would fight us). Instead, the hook simply reads `progress.percentage` and `isComplete` from the public context and detects the edge component-locally. The provider's `notifiedComplete` is for `config.onComplete` callbacks — those are independent of UI celebration.
- **canvas-confetti is `'use client'` only — DO NOT static-import at module scope.** Bare `import 'canvas-confetti'` touches `window` at module-eval time and throws `ReferenceError: window is not defined` under Node SSR / Next.js RSC (upstream issue [catdad/canvas-confetti#78](https://github.com/catdad/canvas-confetti/issues/78)). Dynamic-import happens inside a `useEffect`, never at module scope. A future contributor "simplifying" the import to module top will break every SSR consumer — pin this with an inline comment at the import call site.
- **No new external libraries beyond `canvas-confetti`.** Tailwind animations, existing `useReducedMotion`, existing context — that's it.

---

## Tasks

### Task 6.1 — `forwardRef` widening on `<ChecklistLauncher>` exposing `{ open(), close(), toggle() }` (2–3 h)

Update `packages/checklists/src/components/checklist-launcher.tsx`:

1. Add `ChecklistLauncherRef` interface (paste verbatim from the Architecture section above) at the top of the file.
2. Add an optional `buttonRef?: React.Ref<HTMLButtonElement>` prop to `ChecklistLauncherProps` so consumers who previously used `ref={x}` to grab the DOM button can migrate.
3. Change `React.forwardRef<HTMLButtonElement, ChecklistLauncherProps>` → `React.forwardRef<ChecklistLauncherRef, ChecklistLauncherProps>`.
4. Inside the component, wire `useImperativeHandle`:

```tsx
const [isOpen, setIsOpen] = React.useState(false)

React.useImperativeHandle(
  ref,
  () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  }),
  [] // setIsOpen identity is stable per React's reducer contract; empty deps is safe
)
```

5. Replace the existing `mergedRef` (lines 92–102) — the forwarded `ref` is no longer the button DOM node. Update `useFloating` to take the button ref via `props.buttonRef` (or an internal ref that we merge with `buttonRef`):

```tsx
const internalButtonRef = React.useRef<HTMLButtonElement | null>(null)
const mergedButtonRef = React.useCallback(
  (node: HTMLButtonElement | null) => {
    internalButtonRef.current = node
    refs.setReference(node)
    if (typeof props.buttonRef === 'function') props.buttonRef(node)
    else if (props.buttonRef) (props.buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
  },
  [refs, props.buttonRef]
)
// ...
<button ref={mergedButtonRef} ... />
```

6. Export `ChecklistLauncherRef` from the component file AND from `packages/checklists/src/components/index.ts` AND from `packages/checklists/src/index.ts`.

**Sanity check:** `pnpm --filter @tour-kit/checklists typecheck` exits 0. In a Vitest test, mount `<ChecklistLauncher ref={ref} checklistId="x" />`, call `ref.current.open()`, assert `getByRole('dialog')` exists. Call `ref.current.close()`, assert the dialog is gone. Call `ref.current.toggle()` twice, assert it returns to closed.

---

### Task 6.2 — `<ChecklistCompletion>` + `useChecklistCelebration` hook (3–4 h)

**Depends on:** 6.1 (independent files, but 6.1's pattern of `useImperativeHandle` + ref shape is the precedent for adding new public APIs in this phase)

Create the celebration hook first, then the component:

#### `packages/checklists/src/hooks/use-checklist-celebration.ts` (NEW)

One-shot edge detector. Emits `shouldFire: true` exactly once when the underlying checklist transitions from incomplete to complete. `hasCelebrated` stays `true` after that edge until the component unmounts, so the static badge remains visible without re-firing effects.

```ts
'use client'

import * as React from 'react'
import { useChecklist } from './use-checklist'

/**
 * One-shot edge signal — returns `true` exactly once on the transition
 * `isComplete: false → true` for the given checklist, then `false` forever
 * until the consumer component unmounts.
 *
 * Component-local — does NOT touch the provider's `notifiedComplete` set
 * (which exists for `config.onComplete` callbacks). Mount-scoped only.
 */
export function useChecklistCelebration(checklistId: string): {
  shouldFire: boolean
  hasCelebrated: boolean
} {
  const { isComplete, progress } = useChecklist(checklistId)
  const previousCompleteRef = React.useRef<boolean>(false)
  const hasFiredRef = React.useRef<boolean>(false)
  const [hasCelebrated, setHasCelebrated] = React.useState(false)

  // Edge: prev=false, now=true, AND total > 0 (an empty checklist can't celebrate)
  const isEdge = isComplete && !previousCompleteRef.current && progress.total > 0
  const shouldFire = isEdge && !hasFiredRef.current

  React.useEffect(() => {
    previousCompleteRef.current = isComplete
    if (shouldFire) {
      hasFiredRef.current = true
      setHasCelebrated(true)
    }
  }, [isComplete, shouldFire])

  return { shouldFire, hasCelebrated }
}
```

> **Why a custom hook and not inline state?** Two reasons: (1) testability — we can mock `useChecklist` in isolation and assert the edge logic with a tiny harness; (2) Phase 19 / future packages (announcements, adoption) may want the same one-shot edge detection. Extract it once.

#### `packages/checklists/src/components/checklist-completion.tsx` (NEW)

```tsx
'use client'

import { cn, useReducedMotion } from '@tour-kit/core'
import * as React from 'react'
import { useChecklistCelebration } from '../hooks/use-checklist-celebration'

export type ChecklistCompletionVariant = 'confetti' | 'checkmark' | 'none'

export interface ChecklistCompletionProps {
  checklistId: string
  variant?: ChecklistCompletionVariant
  label?: string
  onCelebrate?: () => void
  className?: string
}

export function ChecklistCompletion({
  checklistId,
  variant = 'checkmark',
  label = 'Done!',
  onCelebrate,
  className,
}: ChecklistCompletionProps): React.ReactElement | null {
  const { shouldFire, hasCelebrated } = useChecklistCelebration(checklistId)
  const reducedMotion = useReducedMotion()
  const confettiModuleRef = React.useRef<
    typeof import('canvas-confetti').default | null
  >(null)

  // Fire effect — runs ONCE on the edge. Idempotent guard inside hook means
  // a re-render with `shouldFire === false` is a no-op.
  React.useEffect(() => {
    if (!shouldFire) return
    onCelebrate?.()

    // Tier 3 gate + variant gate. Under reduce or for non-confetti variants,
    // we never even attempt the dynamic import — bundle stays slim and the
    // OS pref is honored before canvas-confetti's own disableForReducedMotion.
    if (variant !== 'confetti' || reducedMotion) return

    let cancelled = false
    void (async () => {
      try {
        if (!confettiModuleRef.current) {
          // Dynamic import — peer-optional. If canvas-confetti is not installed,
          // the import throws and we silently fall back to the static badge.
          const mod = await import('canvas-confetti')
          confettiModuleRef.current = mod.default
        }
        if (cancelled) return
        confettiModuleRef.current?.({
          particleCount: 80,
          spread: 70,
          origin: { x: 0.5, y: 0.6 },
          disableForReducedMotion: true, // defense-in-depth
        })
      } catch {
        // canvas-confetti not installed — static badge fallback already rendered.
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[@tour-kit/checklists] <ChecklistCompletion variant="confetti"> requires the optional peer dep `canvas-confetti`. Falling back to the static "Done!" badge.'
          )
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [shouldFire, variant, reducedMotion, onCelebrate])

  if (variant === 'none' || !hasCelebrated) return null

  return (
    <div role="status" aria-live="polite" className={className}>
      <CheckIcon aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
```

> **Implementation note for badge render persistence.** The hook owns both parts of the state: `shouldFire` is an edge signal used by the effect, and `hasCelebrated` is the persistent render gate used by the badge. Do not mirror this state a second time inside `<ChecklistCompletion>`.

Revised render block:

```tsx
if (variant === 'none' || !hasCelebrated) return null

return (
  <div
    role="status"
    aria-live="polite"
    className={cn(
      'inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-300',
      'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-50 motion-safe:duration-200',
      className
    )}
    data-tk-celebration={variant}
    data-tk-reduced-motion={reducedMotion || undefined}
  >
    <CheckIcon aria-hidden="true" />
    <span>{label}</span>
  </div>
)
```

#### `packages/checklists/src/index.ts` (UPDATED)

Re-export the new component, its props, the variant type, the hook, AND `useReducedMotion` (so consumers don't need a separate `@tour-kit/core` import):

```ts
export { ChecklistCompletion } from './components/checklist-completion'
export type { ChecklistCompletionProps, ChecklistCompletionVariant } from './components/checklist-completion'
export { useChecklistCelebration } from './hooks/use-checklist-celebration'
export { useReducedMotion } from '@tour-kit/core'
```

#### `packages/checklists/package.json` (UPDATED)

Add `canvas-confetti` as optional peer + devDep (see Architecture / Library decision section for exact JSON snippet).

**Sanity check:** `pnpm --filter @tour-kit/checklists typecheck` and `pnpm --filter @tour-kit/checklists test` exit 0. Vitest: complete the last task, assert `confetti` spy called once. Re-render the component without state change → spy NOT called again. Mock `useReducedMotion → true`, repeat → spy NOT called, static badge renders. Set `variant="checkmark"`, complete last task → spy NOT called (no dynamic import), badge renders.

---

### Task 6.3 — Reduced-motion three-tier defense + tier-2 keyframe wrap (if needed) (1 h)

**Depends on:** 6.2

This is mostly verification + documentation, not new code, because Phase 6's animations live on tailwindcss-animate utilities (tier 1) and a JS branch (tier 3). The tier-2 keyframe wrapper only matters if 6.2's review feedback adds a custom `tk-celebrate-pulse` keyframe.

Concretely:

1. **Tier 1 verification** — grep the new component for `animate-in`, `fade-in`, `zoom-in-50`, `transition-*` and confirm every match has the `motion-safe:` prefix. A reduced-motion user sees the badge appear instantly with no animation.
2. **Tier 3 verification** — confirm the order of guards in the `useEffect`: `if (variant !== 'confetti' || reducedMotion) return` BEFORE any dynamic import. Add a Vitest assertion that mocks the dynamic import (`vi.doMock('canvas-confetti', ...)`) and asserts the mock was NEVER called when `reducedMotion === true`.
3. **Tier 2 conditional** — IF you decide during 6.2 to add a custom keyframe (e.g., a gentle bounce on the badge), add it to `packages/checklists/src/styles/animations.css` and wrap it identically to the existing `tk-fade-completed` / `tk-check-pop` block:

```css
@keyframes tk-celebrate-pulse { /* ... */ }

@media (prefers-reduced-motion: reduce) {
  [data-tk-celebration] { animation: none; }
}
```

Otherwise, leave `animations.css` untouched.

4. **Lighthouse a11y on a story page** — create or update `apps/docs/content/docs/checklists/imperative-api.mdx`'s "Celebration variants" section to host a live `<ChecklistCompletion>` example. Run Lighthouse against `http://localhost:3000/docs/checklists/imperative-api` with `prefers-reduced-motion: reduce` set in DevTools, assert Accessibility score = 100. (This is a smoke check, not a CI gate.)

**Sanity check:** Vitest reduced-motion test passes — `useReducedMotion` mocked to `true`, `variant="confetti"`, last task completes → static badge renders, `<canvas>` is NOT in the DOM, `vi.doMock('canvas-confetti')` factory was NEVER invoked.

---

### Task 6.4 — Docs for imperative API + celebration variants (1–2 h)

**Depends on:** 6.1, 6.2

Create `apps/docs/content/docs/checklists/imperative-api.mdx` with three H2 sections:

1. **Imperative control with `useRef<ChecklistLauncherRef>`** — explain `open() / close() / toggle()`; show a navbar "Need help?" button that calls `launcherRef.current?.open()`. Mention the `buttonRef` migration if consumers used to grab the DOM button via `ref`.
2. **Celebrating completion with `<ChecklistCompletion>`** — three subsections, one per variant. Each has a runnable `tsx` code block. The `confetti` subsection includes the install line for the optional peer dep (`pnpm add canvas-confetti`) and notes the reduced-motion fallback.
3. **Reduced-motion guarantee** — pin the three-tier defense table verbatim from CLAUDE.md, then show the static badge that reduce-motion users see.

Update `apps/docs/content/docs/checklists/meta.json` `pages` array to include `"imperative-api"` — slot it between `components` and `headless`:

```json
{
  "title": "@tour-kit/checklists",
  "icon": "ListChecks",
  "pages": ["index", "providers", "hooks", "components", "imperative-api", "headless", "utilities", "types"]
}
```

Optional Storybook story: `packages/checklists/.storybook` does not currently exist, so a story is skipped this phase — the MDX page with live previews is the canonical demo surface.

**Sanity check:** `pnpm --filter @tour-kit/docs build` exits 0; `pnpm --filter @tour-kit/docs dev` renders the new page in the sidebar under `@tour-kit/checklists`; all code blocks compile (no TS errors in the MDX-rendered snippets).

---

## Deliverables

```
packages/checklists/
├── src/
│   ├── components/
│   │   ├── checklist-launcher.tsx              # UPDATED — forwardRef<ChecklistLauncherRef>;
│   │   │                                       #   useImperativeHandle({ open, close, toggle });
│   │   │                                       #   optional buttonRef prop for the DOM node
│   │   ├── checklist-completion.tsx            # NEW — variant: confetti|checkmark|none;
│   │   │                                       #   reduced-motion gate; dynamic-import canvas-confetti
│   │   └── index.ts                            # UPDATED — export ChecklistCompletion + types
│   ├── hooks/
│   │   ├── use-checklist-celebration.ts        # NEW — one-shot edge hook;
│   │   │                                       #   returns { shouldFire, hasCelebrated }
│   │   └── index.ts                            # UPDATED — export useChecklistCelebration
│   ├── index.ts                                # UPDATED — re-export ChecklistCompletion,
│   │                                           #   useChecklistCelebration, useReducedMotion,
│   │                                           #   ChecklistLauncherRef
│   └── __tests__/
│       ├── checklist-launcher.imperative.test.tsx   # NEW — open/close/toggle via ref;
│       │                                            #   buttonRef wiring preserved
│       └── checklist-completion.reduced-motion.test.tsx  # NEW — confetti fires once;
│                                                         #   reduced-motion gates import;
│                                                         #   variant=none / checkmark render paths
└── package.json                                # UPDATED — canvas-confetti as optional peer + devDep

apps/docs/content/docs/checklists/
├── imperative-api.mdx                          # NEW — ref API + 3 variant examples + reduced-motion table
└── meta.json                                   # UPDATED — slot "imperative-api" after "components"
```

No other packages touched. No new shared utilities. No provider changes.

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/checklists typecheck` exits 0
- [ ] `pnpm --filter @tour-kit/checklists test` exits 0 with both new test files green:
  - `checklist-launcher.imperative.test.tsx` ≥ 4 cases: (a) `ref.current.open()` opens the panel without simulating a click — assert `getByRole('dialog', { name: /checklist/i })` is in the document; (b) `ref.current.close()` closes it; (c) `ref.current.toggle()` flips state on consecutive calls (open → close → open); (d) `buttonRef` is still wired — assert `buttonRef.current` is the underlying `<button>` element
  - `checklist-completion.reduced-motion.test.tsx` ≥ 5 cases: (a) `variant="confetti"` with `useReducedMotion → false` fires the confetti spy exactly once on completion edge; (b) re-render after firing does NOT re-fire; (c) `variant="confetti"` with `useReducedMotion → true` does NOT call the dynamic import (assert via `vi.doMock` factory spy) and renders the static badge instead; (d) `variant="checkmark"` renders the static badge with no dynamic import attempted; (e) `variant="none"` renders nothing — `container.firstChild` is `null`
- [ ] State-machine test in `checklist-completion.reduced-motion.test.tsx` enumerates: empty checklist (no celebration), single-task completion (fires once), 99% → 100% transition (fires once), unmount-then-remount-then-re-complete (fires once after remount), within-same-mount re-complete after reset (does NOT re-fire)
- [ ] Pinned-array test asserts `ChecklistCompletionVariant` literal-equals `'confetti' | 'checkmark' | 'none'` exactly (snapshot the type via a runtime tuple `['confetti', 'checkmark', 'none'] as const satisfies readonly ChecklistCompletionVariant[]` plus a length assertion) — drift breaks CI
- [ ] `pnpm --filter @tour-kit/docs build` exits 0 and `imperative-api.mdx` appears in the rendered sidebar between `components` and `headless`
- [ ] Bundle smoke check: building a consumer app with `variant="checkmark"` only (no `canvas-confetti` install) succeeds; building with `variant="confetti"` requires the peer install; both paths produce the static badge under reduced-motion
- [ ] No regressions: `pnpm --filter @tour-kit/checklists test` covers all existing test files green; `<ChecklistLauncher>` consumers that did NOT pass a `ref` see byte-identical behaviour (existing tests in `src/__tests__/` stay green without snapshot regeneration)
- [ ] CHANGELOG entry under `@tour-kit/checklists` notes: (a) new `ChecklistLauncherRef` payload — typed ref change with `buttonRef` migration line; (b) new `<ChecklistCompletion>` component; (c) `canvas-confetti` as optional peer

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 6 of Tour Kit v2 Package Polish — **Checklist Imperative + Completion Celebration**. All work is additive; existing consumers see byte-identical behaviour unless they opt in to the new APIs.

### What This Project Is
Tour Kit is a pnpm + Turborepo monorepo of 12 React packages providing headless onboarding/product-tour primitives. Strict TypeScript, ES2020 target, tsup for bundling, vitest for unit tests. The package you are touching this phase is `@tour-kit/checklists` — interactive onboarding checklists with task dependencies, progress tracking, and persistence. It currently ships `<ChecklistLauncher>` (a floating button + expandable panel via floating-ui) and a `ChecklistProvider` that tracks completion through a reducer.

### Established in Prior Phases
- Phase 6 has no upstream phase dependencies (`Depends on: Nothing`).
- Existing implementation surface you'll modify:
  - `packages/checklists/src/components/checklist-launcher.tsx` — currently `forwardRef<HTMLButtonElement, ChecklistLauncherProps>` with internal `isOpen` state at line 75 and a `mergedRef` helper at lines 92–102. Floating-ui drives positioning; `useDismiss` + `useRole` wire ARIA.
  - `packages/checklists/src/context/checklist-provider.tsx` — completion firing at lines 414–431 uses a `state.notifiedComplete: Set<string>` to prevent re-firing `config.onComplete?.()` across reloads. **Do not touch this.** Your component-local edge detector is independent of it.
  - `packages/checklists/src/hooks/use-checklist.ts` — exposes `isComplete`, `progress`, `progress.total`, `progress.completed`. This is your read path.
  - `packages/checklists/src/styles/animations.css` — existing tier-2 keyframe wrapper at lines 49–54 (wraps `tk-fade-completed` + `tk-check-pop`, NOT `tk-strike` — that name is a stale doc reference in some places). Mirror this pattern only if you add a new keyframe.
  - `packages/checklists/src/components/checklist-task.tsx:3` — imports `useReducedMotion` from `@tour-kit/core` directly. This phase ADDS the re-export to `@tour-kit/checklists/src/index.ts` so consumers can import it from the package.
- Existing reduced-motion three-tier defense (cross-package contract, see below) is load-bearing.

### Your Goal for This Phase
1. Widen `<ChecklistLauncher>`'s `forwardRef` to expose `{ open(), close(), toggle() }` via `useImperativeHandle`. Add an optional `buttonRef` prop so consumers who used the old `ref` to grab the DOM button can migrate.
2. Ship `<ChecklistCompletion variant="confetti" | "checkmark" | "none">` that fires exactly once per mount on the last-task-completes edge.
3. Honor `prefers-reduced-motion: reduce` via the three-tier defense — under reduce, `variant="confetti"` renders a static "Done!" badge and the dynamic import never runs.
4. Use `canvas-confetti` as an **optional** peer dep (peer-optional + devDep), dynamically imported only when `variant === 'confetti' && !reducedMotion`. A missing peer falls back to the static badge with a one-time `console.warn` in dev.
5. Add a docs page under `apps/docs/content/docs/checklists/imperative-api.mdx`.

### Data Model Rules (follow exactly)
- **`interface` (exported):** `ChecklistLauncherRef`, `ChecklistCompletionProps` — both in their owning component files; re-exported from `packages/checklists/src/index.ts`.
- **`type` (exported):** `ChecklistCompletionVariant = 'confetti' | 'checkmark' | 'none'` — closed literal union, not extensible.
- **`useChecklistCelebration` returns `{ shouldFire: boolean; hasCelebrated: boolean }`** — `shouldFire` triggers the side effect (fires on exactly one render — the edge); `hasCelebrated` gates the render of the persistent badge (stays `true` from the edge until unmount).
- **No new context, no new provider.** Read state through the existing `useChecklist(id)` hook.
- **`canvas-confetti` is `peerDependenciesMeta.optional: true`** in `packages/checklists/package.json`. Dynamic import inside a `useEffect`. Wrapped in `try/catch` so a missing peer is a graceful fallback, not a crash.
- **One-shot per mount.** After firing, `hasFiredRef.current = true` blocks subsequent fires until unmount. Consumers wanting re-fire on reset must `key` the component on a session id.
- **The provider's `notifiedComplete` set is for `config.onComplete` callbacks.** Do NOT consume it from `<ChecklistCompletion>` — your edge detection is component-local.

### Reduced-Motion Three-Tier Defense (cross-package contract, copied verbatim from repo-root CLAUDE.md)

1. **`motion-safe:` Tailwind prefix** on every `tailwindcss-animate` utility (`animate-in`, `fade-*`, `slide-*`, `zoom-*`) in cva variants. Compiles to `@media (prefers-reduced-motion: no-preference)` — under reduce, the utility never applies. Required because `tailwindcss-animate` does not auto-respect the OS pref.
2. **`@media (prefers-reduced-motion: reduce)` keyframe wrappers** for custom `@keyframes` we own (`tk-fade-completed` / `tk-check-pop` in `checklists` are already wrapped at `packages/checklists/src/styles/animations.css:49–54`). If you add a new keyframe this phase, wrap it identically.
3. **JS gate via `useReducedMotion()`** from `@tour-kit/core` for render-time class branches or conditional renders. **This is the load-bearing gate for confetti.** Branch BEFORE the dynamic import — under reduce, the import never runs.

### Public ref interface (the contract — locks this phase)

```ts
// packages/checklists/src/components/checklist-launcher.tsx
export interface ChecklistLauncherRef {
  /** Open the checklist panel. Idempotent — calling on already-open is a no-op. */
  open(): void
  /** Close the checklist panel. Idempotent. */
  close(): void
  /** Toggle the panel open state. */
  toggle(): void
}

export const ChecklistLauncher = React.forwardRef<
  ChecklistLauncherRef,
  ChecklistLauncherProps
>((props, ref) => { /* ... */ })
```

### Library Decision — `canvas-confetti` (Context7 confirmed)

**Use `canvas-confetti` (^1.9.0) as an optional peer dep, dynamically imported.** Hand-rolling a canvas RAF with particle physics would be 80–120 LOC of code we'd have to maintain and StrictMode-test ourselves. canvas-confetti is ~4 KB gzipped, MIT, zero transitive deps, High source reputation, and ships a built-in `disableForReducedMotion` flag (defense-in-depth below our own tier-3 JS gate).

> ⚠️ **SSR hazard — do NOT static-import.** Bare `import 'canvas-confetti'` reads `window` at module-eval time and throws `ReferenceError: window is not defined` under Node SSR / Next.js RSC (upstream [catdad/canvas-confetti#78](https://github.com/catdad/canvas-confetti/issues/78)). Always use `await import('canvas-confetti')` inside a `useEffect`, never at module top. Annotate the import call site with a comment so future cleanups don't "simplify" it.

Context7-confirmed API:
```ts
import confetti from 'canvas-confetti'

confetti({
  particleCount: 80,         // default 50
  spread: 70,                // default 45
  origin: { x: 0.5, y: 0.6 },
  disableForReducedMotion: true,
})
// Returns Promise<void> that resolves when animation completes.
```

`package.json` patch (apply to `packages/checklists/package.json`):
```jsonc
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "@mui/base": "^5.0.0-beta.0",
    "canvas-confetti": "^1.9.0"
  },
  "peerDependenciesMeta": {
    "@mui/base": { "optional": true },
    "canvas-confetti": { "optional": true }
  },
  "devDependencies": {
    "canvas-confetti": "^1.9.0",
    "@types/canvas-confetti": "^1.6.4"
    // ...existing devDeps unchanged
  }
}
```

### Architecture

```
@tour-kit/checklists
  src/components/checklist-launcher.tsx              ← UPDATED — forwardRef<ChecklistLauncherRef>;
                                                        useImperativeHandle({ open, close, toggle });
                                                        optional buttonRef prop preserves DOM-node access
  src/components/checklist-completion.tsx            ← NEW
    variant: 'confetti' | 'checkmark' | 'none'
    reads useChecklistCelebration(id) for the one-shot edge
    reads useReducedMotion() — tier-3 gate
    if variant === 'confetti' && !reducedMotion → dynamic-import canvas-confetti, fire confetti({...})
    else → render static "Done!" badge (or null for variant='none')
  src/hooks/use-checklist-celebration.ts             ← NEW
    returns { shouldFire: boolean; hasCelebrated: boolean }
    one-shot edge detector, mount-scoped
  src/index.ts                                       ← UPDATED — re-exports
  package.json                                       ← UPDATED — canvas-confetti optional peer

apps/docs/content/docs/checklists/imperative-api.mdx  ← NEW
apps/docs/content/docs/checklists/meta.json           ← UPDATED — slot "imperative-api"
```

### Files to Create / Update

#### `packages/checklists/src/components/checklist-launcher.tsx` (UPDATED)
- Add `ChecklistLauncherRef` interface (exact shape above) at the top.
- Add optional `buttonRef?: React.Ref<HTMLButtonElement>` to `ChecklistLauncherProps` (between `panelClassName` and `children`).
- Change `forwardRef<HTMLButtonElement, ChecklistLauncherProps>` → `forwardRef<ChecklistLauncherRef, ChecklistLauncherProps>`.
- Wire `useImperativeHandle(ref, () => ({ open: () => setIsOpen(true), close: () => setIsOpen(false), toggle: () => setIsOpen(prev => !prev) }), [])` inside the component (before the early-return checks at line 104).
- Replace the existing `mergedRef` (lines 92–102) — the forwarded `ref` is no longer the button DOM node. Use an internal `React.useRef<HTMLButtonElement | null>(null)` and merge with `props.buttonRef` (function-ref or object-ref). Pass that merged callback to `<button ref={...}>`.
- Export `ChecklistLauncherRef` from this file and re-export from `packages/checklists/src/components/index.ts`.

#### `packages/checklists/src/hooks/use-checklist-celebration.ts` (NEW)
One-shot edge detector. Reads `isComplete` + `progress.total` from `useChecklist(id)`. Maintains `previousCompleteRef: React.useRef<boolean>(false)` and `hasFiredRef: React.useRef<boolean>(false)`. Returns `{ shouldFire, hasCelebrated }`:
- `shouldFire = isComplete && !previousCompleteRef.current && progress.total > 0 && !hasFiredRef.current` — true on exactly one render (the edge).
- `hasCelebrated` is a `useState<boolean>` flipped inside the `useEffect` that runs when `shouldFire === true`. Stays `true` until unmount.
- Inside the `useEffect`: `previousCompleteRef.current = isComplete; if (shouldFire) { hasFiredRef.current = true; setHasCelebrated(true) }`.

#### `packages/checklists/src/hooks/index.ts` (UPDATED)
Add `export { useChecklistCelebration } from './use-checklist-celebration'`.

#### `packages/checklists/src/components/checklist-completion.tsx` (NEW)
Function component (not forwardRef). Props per the contract above. Logic:
- `const { shouldFire, hasCelebrated } = useChecklistCelebration(checklistId)`
- `const reducedMotion = useReducedMotion()`
- `const confettiModuleRef = React.useRef<typeof import('canvas-confetti').default | null>(null)`
- Side-effect `useEffect`:
  ```ts
  if (!shouldFire) return
  onCelebrate?.()
  if (variant !== 'confetti' || reducedMotion) return
  let cancelled = false
  void (async () => {
    try {
      if (!confettiModuleRef.current) {
        const mod = await import('canvas-confetti')
        confettiModuleRef.current = mod.default
      }
      if (cancelled) return
      confettiModuleRef.current?.({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.5, y: 0.6 },
        disableForReducedMotion: true,
      })
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[@tour-kit/checklists] <ChecklistCompletion variant="confetti"> requires the optional peer dep `canvas-confetti`. Falling back to the static "Done!" badge.')
      }
    }
  })()
  return () => { cancelled = true }
  ```
  Deps: `[shouldFire, variant, reducedMotion, onCelebrate]`.
- Render gate:
  ```tsx
  if (variant === 'none' || !hasCelebrated) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-300',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-50 motion-safe:duration-200',
        className
      )}
      data-tk-celebration={variant}
      data-tk-reduced-motion={reducedMotion || undefined}
    >
      <CheckIcon aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
  ```
- Inline `CheckIcon` SVG (≤200 bytes minified) — no new icon-library dep.

#### `packages/checklists/src/components/index.ts` (UPDATED)
Add `export { ChecklistCompletion } from './checklist-completion'` and `export type { ChecklistCompletionProps, ChecklistCompletionVariant } from './checklist-completion'`. Also `export type { ChecklistLauncherRef } from './checklist-launcher'`.

#### `packages/checklists/src/index.ts` (UPDATED)
Re-export from the barrel:
- `ChecklistCompletion` + `ChecklistCompletionProps` + `ChecklistCompletionVariant`
- `useChecklistCelebration`
- `ChecklistLauncherRef`
- `useReducedMotion` from `@tour-kit/core` (ergonomic re-export, mirrors the announcements/surveys/hints pattern from CLAUDE.md)

#### `packages/checklists/package.json` (UPDATED)
Apply the JSON patch from "Library Decision" above. Run `pnpm install` to update the lockfile.

#### `packages/checklists/src/__tests__/checklist-launcher.imperative.test.tsx` (NEW)
Vitest + @testing-library/react. ≥4 cases:
1. `const ref = React.createRef<ChecklistLauncherRef>()`; render `<ChecklistLauncher ref={ref} checklistId="onboarding" />`; call `act(() => ref.current!.open())`; assert `getByRole('dialog', { name: /checklist/i })` is in the document.
2. Open the panel via `ref.current!.open()`, then `ref.current!.close()`, assert dialog is gone.
3. `ref.current!.toggle()` four times in sequence; assert dialog visibility alternates `open, close, open, close`.
4. `const buttonRef = React.createRef<HTMLButtonElement>()`; render with both `ref` and `buttonRef`; assert `buttonRef.current` is `HTMLButtonElement` and is the same node as `getByRole('button', { name: /open checklist/i })`.

Use the existing `test-utils.tsx` harness at `packages/checklists/src/__tests__/test-utils.tsx` for the `ChecklistProvider` wrapper.

#### `packages/checklists/src/__tests__/checklist-completion.reduced-motion.test.tsx` (NEW)
Vitest. Use `vi.mock('@tour-kit/core', async (orig) => { ... useReducedMotion: vi.fn() ... })` to control the reduced-motion return. Use `vi.doMock('canvas-confetti', () => ({ default: vi.fn() }))` for the confetti spy. ≥5 cases:
1. **Happy path:** `useReducedMotion → false`, `variant="confetti"`, complete the last task → `confettiSpy` called exactly once with `{ particleCount: 80, spread: 70, origin: { x: 0.5, y: 0.6 }, disableForReducedMotion: true }`.
2. **One-shot guarantee:** after (1), force a re-render → `confettiSpy` still has call count `1`.
3. **Reduced-motion gate:** `useReducedMotion → true`, `variant="confetti"`, complete the last task → `confettiSpy` NOT called, dynamic-import factory NEVER invoked (assert via `vi.doMock` factory call count = 0), static badge rendered with `data-tk-reduced-motion="true"`.
4. **Checkmark variant:** `variant="checkmark"`, complete the last task → no dynamic import, static badge rendered with the default label "Done!".
5. **None variant:** `variant="none"`, complete the last task → `container.firstChild === null`, no dynamic import attempted.

Plus a state-machine block (use `describe.each` with these rows): `(empty checklist, 0 fires)`, `(single-task complete, 1 fire)`, `(99% → 100%, 1 fire)`, `(unmount + remount + re-complete, 1 fire after remount)`, `(within-same-mount reset + re-complete, 0 additional fires)`.

Plus the pinned-literal test: `const VARIANTS = ['confetti', 'checkmark', 'none'] as const satisfies readonly ChecklistCompletionVariant[]; expect(VARIANTS).toHaveLength(3)`.

#### `apps/docs/content/docs/checklists/imperative-api.mdx` (NEW)
Frontmatter: `title: Imperative API & Completion`, `description: Drive <ChecklistLauncher> from anywhere with a typed ref, and celebrate completion with <ChecklistCompletion>.`. Three H2 sections per Task 6.4. Each H2 has a fenced ```tsx code block. The reduced-motion section pastes the three-tier table verbatim from CLAUDE.md.

#### `apps/docs/content/docs/checklists/meta.json` (UPDATED)
Update `"pages"` to `["index", "providers", "hooks", "components", "imperative-api", "headless", "utilities", "types"]`.

### Success Criteria
- `pnpm --filter @tour-kit/checklists typecheck` exits 0
- `pnpm --filter @tour-kit/checklists test` exits 0 with both new test files green
- `launcherRef.current!.open()` opens the panel from a sibling subtree without simulating a DOM click
- `<ChecklistCompletion variant="confetti">` fires `canvas-confetti` exactly once per mount on the completion edge
- Under `useReducedMotion → true`, `variant="confetti"` renders only the static badge — `canvas-confetti` is never dynamically imported
- `variant="checkmark"` renders a static badge with no dynamic import; `variant="none"` renders nothing
- `pnpm --filter @tour-kit/docs build` exits 0; new MDX page renders in sidebar between `components` and `headless`
- Existing `<ChecklistLauncher>` tests in `packages/checklists/src/__tests__/` stay green; consumers that did NOT pass a `ref` see byte-identical behaviour
- CHANGELOG entry documents the typed-ref change with `buttonRef` migration

### Expected File Structure at End

```
packages/checklists/
├── src/
│   ├── components/
│   │   ├── checklist-launcher.tsx              # UPDATED
│   │   ├── checklist-completion.tsx            # NEW
│   │   └── index.ts                            # UPDATED
│   ├── hooks/
│   │   ├── use-checklist-celebration.ts        # NEW
│   │   └── index.ts                            # UPDATED
│   ├── index.ts                                # UPDATED
│   └── __tests__/
│       ├── checklist-launcher.imperative.test.tsx           # NEW
│       └── checklist-completion.reduced-motion.test.tsx     # NEW
└── package.json                                # UPDATED — canvas-confetti optional peer + devDep

apps/docs/content/docs/checklists/
├── imperative-api.mdx                          # NEW
└── meta.json                                   # UPDATED
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 6 has no upstream phase dependencies (`Depends on: Nothing` per big-plan.md). Source-of-truth files (`checklist-launcher.tsx` lines 60/75/92–102, `checklist-provider.tsx` lines 414–431, `checklist-task.tsx:3` `useReducedMotion` import, `animations.css:49–54` tier-2 keyframe block wrapping `tk-fade-completed` + `tk-check-pop`, `use-checklist.ts` return shape, `meta.json` pages array) all verified to exist at the cited paths.
- [PASS] Every sub-task has a clear, testable completion condition — each of 6.1–6.4 ends with a one-paragraph "Sanity check" (typecheck command + Vitest assertion + docs build).
- [PASS] Execution prompt is self-contained — three-tier reduced-motion contract pasted verbatim from CLAUDE.md, `ChecklistLauncherRef` interface pasted inline, canvas-confetti API + Context7-confirmed signature pasted inline, package.json patch pasted inline, per-file implementation guidance covers exact exports + props + edge cases + dynamic-import error path. No "see Phase X" references.
- [PASS] Exit criteria map 1:1 to deliverables — every NEW/UPDATED file is covered by typecheck, a Vitest case, the build smoke check, or the docs sidebar render check. State-machine test enumerates the five required edges. Pinned-literal type test guards against silent variant drift.
- [PASS] Heavy external deps have a fake/stub strategy noted — `canvas-confetti` is the only new dep, mocked via `vi.doMock('canvas-confetti', () => ({ default: vi.fn() }))` for the spy; the missing-peer fallback is exercised by NOT mocking and asserting the `console.warn`. `useReducedMotion` is mocked via `vi.mock('@tour-kit/core', ...)`.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — `canvas-confetti` API confirmed via Context7 (`/catdad/canvas-confetti`, High source reputation, 59 code snippets). Memory entry created: `lib:canvas-confetti` (G#189, 2026-05-15). The `confetti({ particleCount, spread, origin, disableForReducedMotion })` signature is pasted verbatim in the Execution Prompt with the exact defaults.
