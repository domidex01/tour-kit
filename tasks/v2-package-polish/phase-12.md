# Phase 12 — Checklist Dep Viz + HintGroup

**Duration:** Days 62–66 (~8–12 hours)
**Depends on:** Phase 3 (the `<HintHotspot>` variant interface — `<HintGroup>` composes preset hints, so the `HintHotspotVariantName` contract from Phase 3 is consumed here)
**Blocks:** Nothing directly. Feeds the M5 milestone gate (hint/checklist UX polish).
**Risk Level:** MEDIUM — two distinct additive features ship in one phase. The HintGroup focus-management piece (roving `tabindex` + `aria-activedescendant` + single-open invariant) is the delicate part; the locked-task tooltip is mostly a presentational extension of an existing render path. Neither feature widens a public type incompatibly.
**Stack:** react

---

## Objective

Close two day-one UX gaps that consumers hit when their checklists or hints get past three items:

1. **Tell users *why* a task is locked.** Today, `<ChecklistTask>` renders locked rows with `aria-disabled` and a dimmed checkbox — but there is no surfaced explanation, and the user cannot navigate from a locked row to the task that unlocks it. We extend the locked render path in `<ChecklistLauncher>`'s panel (via the `Checklist` body) to show a hover/focus tooltip — `"Locked — complete '<unlocker title>' first"` — with a button that scrolls to and focuses the unlocking task. The unlocker is computed by walking `task.config.dependsOn` and picking the first un-completed, visible dependency (matching the existing `canCompleteTask` resolution order in `utils/dependencies.ts`).
2. **Group hints into a focused, keyboard-navigable sequence.** `<HintGroup>` is a new component in `@tour-kit/hints` that wraps multiple `<Hint>` (or `<HintHotspot>`) children, enforces a single-open invariant (opening hint B closes hint A), and rotates focus across the group with `Tab` / `Shift+Tab` via a roving `tabindex` + `aria-activedescendant` ARIA pattern. `Esc` exits the group and returns focus to whatever element was focused before group entry — no focus trap (which would violate the hint mental model — hints are advisory, not modal).

Both APIs land additively. Existing consumers of `<ChecklistLauncher>` who do not have dependent tasks see byte-identical render. Existing `<Hint>` and `<HintHotspot>` consumers who do not wrap their hints in `<HintGroup>` see byte-identical behaviour.

## What Success Looks Like

1. A `<ChecklistLauncher>` rendered with a config where `task-c.dependsOn = ['task-a']` and `task-a.completed = false` shows the locked tooltip on hover/focus of `task-c`; the tooltip content reads literally `"Locked — complete 'Task A title' first"` — verified by RTL `getByText(/Locked — complete 'Task A title' first/)`.
2. Clicking the lock-tooltip's "Go to Task A" button calls `element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })` on the unlocker's DOM node and moves keyboard focus to it — verified by a Vitest test that stubs `Element.prototype.scrollIntoView`, asserts it was called once with `{ behavior: 'smooth', block: 'nearest' }`, and asserts `document.activeElement === unlockerNode` after the click. The unlocker receives a 2-second `data-tk-highlight` attribute so consumers can style a focus ring.
3. Inside a `<HintGroup>` wrapping two `<Hint>` children, opening hint B (by clicking its hotspot) closes hint A — verified by an RTL test that opens A, opens B, then asserts `queryByText('Hint A content')` is `null`. Single-open invariant holds across `n` children.
4. Inside a `<HintGroup>`, `Tab` from hotspot N moves focus to hotspot N+1; `Shift+Tab` reverses; `Tab` from the last hotspot wraps to the first (configurable via `loop?: boolean`, default `true`); `Esc` closes any open hint, removes group focus, and restores focus to the previously focused element — verified by `@testing-library/user-event` keyboard tests.
5. axe-core scan (`vitest-axe`) on a story page mounting a `<HintGroup>` with three `<Hint>` children reports `0` violations — specifically, no `aria-activedescendant` value mismatches, no missing `role="group"`, no orphan `aria-controls`.
6. `<HintGroup>` works with the three Phase 3 variants (`badge`, `beacon-with-label`, `what-s-new-pill`) — verified by a smoke test mounting `<HintGroup>` with one of each variant and asserting all three render and the single-open invariant holds across them.
7. `pnpm --filter @tour-kit/checklists typecheck` and `pnpm --filter @tour-kit/hints typecheck` both exit `0`. `pnpm --filter @tour-kit/checklists test` and `pnpm --filter @tour-kit/hints test` both exit `0` with the three new test files green.
8. Bundle delta per package is `< 3 KB` gzipped — verified by `pnpm --filter @tour-kit/hints build` and comparing the `dist/index.mjs` gzipped size against the pre-PR baseline (committed to PR description). Same for checklists.

---

## Architecture / Key Design Decisions

```
<ChecklistLauncher checklistId="onboarding"> ───────────────┐
   └─ <Checklist> renders visibleTasks.map(<ChecklistTask>)  │  Phase 12 extends the
                       │                                      │  locked-row path only.
                       └─ if task.locked → wrap in           │  Non-locked tasks are
                          <LockedTaskTooltip task=...>       │  byte-identical.
                                │
                                ├─ on hover/focus → render tooltip
                                │     content: "Locked — complete '<unlocker.title>' first"
                                │     + <button>Go to {unlocker.title}</button>
                                │
                                └─ unlocker resolution:
                                   find tasks.find(t =>
                                     task.config.dependsOn?.includes(t.config.id) &&
                                     !t.completed && t.visible
                                   )

scroll-to-task(taskId):
   ├─ document.querySelector(`[data-tk-task-id="${taskId}"]`)
   ├─ node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
   ├─ node?.focus({ preventScroll: false })   // a11y: focus after scroll lands
   └─ node?.setAttribute('data-tk-highlight', 'true')
       setTimeout(() => node?.removeAttribute('data-tk-highlight'), 2000)


<HintGroup defaultActiveId?="hint-1" onActiveChange?={fn}>  ──┐
   ├─ context: { activeId, setActiveId, register, unregister, focusedIndex, setFocusedIndex }
   │
   ├─ keyboard handler on group <div role="group" aria-activedescendant={`tk-hint-${focusedId}`}>:
   │     Tab        → focusedIndex = (i + 1) % n  (or clamp if loop=false)
   │     Shift+Tab  → focusedIndex = (i - 1 + n) % n
   │     Esc        → setActiveId(null); restore prev focus; bubble (no preventDefault)
   │
   └─ children render `<Hint>` / `<HintHotspot>` — each calls useHintGroupItem(id) which:
        ├─ registers itself on mount with the group's register(id, ref)
        ├─ subscribes to activeId; renders its popover only when activeId === id
        └─ sets tabIndex = isFocused ? 0 : -1 (roving tabindex)
```

### Locked-task tooltip — public contract (no new component export; behaviour is internal to `<Checklist>` / `<ChecklistTask>`)

The locked tooltip is **not** exported as a standalone component this phase. It is a behaviour layer baked into the existing `<ChecklistTask>` render. Two reasons:
- `<ChecklistTask>` already owns the locked render path and the click-suppression for locked rows; bolting a sibling component on would split a single concern across two files.
- Consumers using `renderTask` for fully custom rendering opt out of styled tasks — they bring their own locked UX. Exposing a separate `<LockedTaskTooltip>` would imply a composition surface we are not ready to support across both render paths.

What we *do* export: a tiny `scrollToTask(taskId: string)` helper at `packages/checklists/src/lib/scroll-to-task.ts` so headless consumers and tour callbacks can target the same focus/scroll flow.

```ts
// packages/checklists/src/lib/scroll-to-task.ts
export interface ScrollToTaskOptions {
  /** ScrollIntoView behaviour. Default: 'smooth'. Forced to 'auto' under prefers-reduced-motion. */
  behavior?: ScrollBehavior
  /** Block alignment. Default: 'nearest'. */
  block?: ScrollLogicalPosition
  /** ms to keep the data-tk-highlight attribute on the node. Default: 2000. */
  highlightMs?: number
}

export function scrollToTask(taskId: string, options?: ScrollToTaskOptions): boolean
// Returns true if a node was found and scrolled/focused, false otherwise.
// Looks up via `document.querySelector(\`[data-tk-task-id="${taskId}"]\`)`.
// Requires `<ChecklistTask>` to emit `data-tk-task-id={task.config.id}` (small UPDATE — see Task 12.1).
```

### `<HintGroup>` public contract

```ts
// packages/hints/src/components/hint-group.tsx
export interface HintGroupProps {
  /** ID of the hint that should be open on initial mount. If omitted, no hint is open. */
  defaultActiveId?: string
  /** Called when the active hint changes (open / close / focus rotation). `null` means no hint is open. */
  onActiveChange?(id: string | null): void
  /** Whether Tab from the last item wraps to the first (and Shift+Tab from first wraps to last). Default: true. */
  loop?: boolean
  /** Hints to compose. Must be `<Hint>` or `<HintHotspot>` (or any component that calls useHintGroupItem internally). */
  children: React.ReactNode
  /** Override className on the group wrapper. */
  className?: string
}

export const HintGroup: React.FC<HintGroupProps>
```

```ts
// packages/hints/src/hooks/use-hint-group-item.ts
export interface UseHintGroupItemReturn {
  /** True when this item is the currently active (open) hint. Drives the popover render. */
  isActive: boolean
  /** True when this item is the currently focused element (drives roving tabindex). */
  isFocused: boolean
  /** Tabindex to spread onto the hotspot button. `0` when focused, `-1` otherwise. */
  tabIndex: 0 | -1
  /** Stable DOM id for aria-activedescendant. Pattern: `tk-hint-${id}`. */
  domId: string
  /** Setter for the group's activeId. Pass `id` to open this hint; `null` to close. */
  setActive(next: string | null): void
  /** True when the component is being rendered inside a HintGroup — false in standalone use. */
  inGroup: boolean
}

export function useHintGroupItem(id: string): UseHintGroupItemReturn
```

**Standalone vs in-group rendering.** A `<Hint>` rendered *outside* a `<HintGroup>` keeps the v1 behaviour (independent open/close, full `tabIndex={0}`, no `aria-activedescendant`). The `inGroup` flag from `useHintGroupItem` is `false` and the consumer-facing render branches accordingly. We achieve this by having `useHintGroupItem` read an optional context; when the context is missing it returns a no-op shape (`inGroup: false`, `tabIndex: 0`, `setActive: noop`).

### `aria-activedescendant` keyboard handler pattern (verified ARIA 1.2)

```tsx
// inside HintGroup
const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  const n = itemIds.length
  if (n === 0) return

  if (e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault()
    const next = loop ? (focusedIndex + 1) % n : Math.min(focusedIndex + 1, n - 1)
    setFocusedIndex(next)
    return
  }
  if (e.key === 'Tab' && e.shiftKey) {
    e.preventDefault()
    const next = loop ? (focusedIndex - 1 + n) % n : Math.max(focusedIndex - 1, 0)
    setFocusedIndex(next)
    return
  }
  if (e.key === 'Escape') {
    // Do not preventDefault — let consumer Esc handlers (modals, etc.) still receive it.
    setActiveId(null)
    setFocusedIndex(-1)
    previousFocusRef.current?.focus()
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    setActiveId(itemIds[focusedIndex] ?? null)
  }
}
```

Critical ARIA points:
- The **group container** carries `role="group"`, `aria-activedescendant={\`tk-hint-${itemIds[focusedIndex]}\`}`, and `tabIndex={0}` so it can receive focus. Each child hotspot carries `id={\`tk-hint-${id}\`}` and `tabIndex={isFocused ? 0 : -1}`.
- Focus moves DOM-actually (we call `itemRefs[focusedIndex].current?.focus()` in an effect on `focusedIndex` change) so screen readers announce the focused hotspot. `aria-activedescendant` is a defense-in-depth ARIA layer for AT modes that don't follow DOM focus.
- **No focus trap.** `Esc` returns focus to the pre-group element (captured on first mount via `document.activeElement`). Tab/Shift+Tab cycle within the group when `loop=true`; when `loop=false`, the last Tab passes focus to the next focusable element after the group (let the browser handle it — do not `preventDefault` when at the edge).

### Reduced-motion three-tier defense (per repo-root CLAUDE.md)

| Tier | Mechanism | Where it applies in this phase |
|---|---|---|
| 1 | `motion-safe:` Tailwind prefix on `tailwindcss-animate` utilities | The locked-task tooltip uses `motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150` on appear. Under reduce, the tooltip appears instantly. |
| 2 | `@media (prefers-reduced-motion: reduce)` keyframe wrappers | No new keyframes this phase — `data-tk-highlight` styling uses an existing focus-ring utility, not a new keyframe. If a "highlight pulse" keyframe is added later, wrap it in the same media query block as `tk-fade-completed` / `tk-check-pop` in `packages/checklists/src/styles/animations.css`. |
| 3 | JS gate via `useReducedMotion()` from `@tour-kit/core` | `scrollToTask` forces `behavior: 'auto'` when `useReducedMotion()` returns `true` (smooth scroll is a motion). Implement via `const reducedMotion = useReducedMotion()` inside the lock-tooltip click handler — pass `behavior: reducedMotion ? 'auto' : 'smooth'` to `scrollToTask`. |

### Data Model Strategy

| Layer | Type | Why |
|---|---|---|
| `HintGroupProps` | `interface` exported from `hint-group.tsx` | Consumers may extend or wrap |
| `UseHintGroupItemReturn` | `interface` exported from `use-hint-group-item.ts` | Same — composition surface |
| `ScrollToTaskOptions` | `interface` exported from `scroll-to-task.ts` | Same |
| HintGroup context value | `interface HintGroupContextValue` (internal, not exported) | Provider/consumer plumbing only |
| Per-item registration | `Map<string, React.RefObject<HTMLElement>>` inside the group provider | Need stable lookup by id and a ref to call `.focus()` on |
| `focusedIndex` | `React.useState<number>` (initialized to `-1`; first Tab makes it `0`) | Component-local; never persisted |
| `previousFocusRef` | `React.useRef<HTMLElement | null>(null)` | Captured on first focus-enter; restored on Esc |

**Other critical rules for this phase:**
- **No focus trap.** This is not a dialog. `Esc` exits cleanly; `Tab` at the loop edge can either wrap (`loop=true`) or pass through (`loop=false`). Do NOT use `FloatingFocusManager` or any trap from `@floating-ui/react`.
- **`useHintGroupItem` is the single seam.** Both `<Hint>` and `<HintHotspot>` consume it. `<Hint>` already wraps `<HintHotspot>`, so the integration point is `<HintHotspot>` — patch it once to read the group state, and `<Hint>` inherits.
- **No new dependencies.** ARIA pattern is standard; smooth scroll is browser-native; no icon-library additions.
- **The locked-tooltip stays internal to `<ChecklistTask>`.** Do not export a `<LockedTaskTooltip>` component. The behaviour is gated by `task.locked === true && task.config.dependsOn?.length > 0 && unlocker !== null`.
- **`data-tk-task-id` attribute** must be added to the existing `<ChecklistTask>` root `<div>` (UPDATE, not new). This is the lookup key for `scrollToTask`. Renaming this in the future would silently break the helper — guard it with a Vitest snapshot.

---

## Tasks

### Task 12.1 — Locked-task tooltip + `scrollToTask` helper (3–4 h)

Goal: dependent locked tasks surface their unlocker by name with a one-click navigation affordance.

Sub-steps:

1. **Add `data-tk-task-id` to `<ChecklistTask>` root.** Single-line UPDATE to `packages/checklists/src/components/checklist-task.tsx`. Add `data-tk-task-id={config.id}` to the existing root `<div>` alongside the existing `data-tk-completing` attribute. This is the lookup key for `scrollToTask`.

2. **Create `packages/checklists/src/lib/scroll-to-task.ts`.**

   ```ts
   export interface ScrollToTaskOptions {
     behavior?: ScrollBehavior
     block?: ScrollLogicalPosition
     highlightMs?: number
   }

   export function scrollToTask(taskId: string, options?: ScrollToTaskOptions): boolean {
     if (typeof document === 'undefined') return false
     const node = document.querySelector<HTMLElement>(`[data-tk-task-id="${taskId}"]`)
     if (!node) return false
     const behavior = options?.behavior ?? 'smooth'
     const block = options?.block ?? 'nearest'
     const highlightMs = options?.highlightMs ?? 2000
     node.scrollIntoView({ behavior, block })
     node.focus({ preventScroll: true }) // scroll already happened; don't double-scroll
     node.setAttribute('data-tk-highlight', 'true')
     window.setTimeout(() => node.removeAttribute('data-tk-highlight'), highlightMs)
     return true
   }
   ```

   Export from `packages/checklists/src/index.ts`.

3. **Extend `<ChecklistTask>` render with the locked tooltip.** When `task.locked === true` AND `task.config.dependsOn?.length > 0`, the component:
   - Reads `useChecklist(checklistId)` to access `tasks` (the full state). The `checklistId` is currently not threaded into `<ChecklistTask>` — pass it through from `<Checklist>` as a new optional prop `checklistId?: string`. When absent, the tooltip is suppressed (graceful degradation for headless consumers).
   - Computes the unlocker: `tasks.find(t => task.config.dependsOn!.includes(t.config.id) && !t.completed && t.visible)`. If `null`, suppress the tooltip (defensive — dependency exists but is invisible/already-complete; shouldn't reach here if `canCompleteTask` is correct, but belt-and-braces).
   - Renders a `<TooltipContent>` (use `@floating-ui/react` — already a dep) anchored to the task row, with `aria-label` + the literal `"Locked — complete '<unlocker title>' first"` text. Inside, a `<button type="button">` reading `"Go to <unlocker title>"` that calls `scrollToTask(unlocker.config.id, { behavior: reducedMotion ? 'auto' : 'smooth' })`.
   - Shows on `hover` (`pointerenter`) and on `focus` (`focusin`) of the task row; hides on `pointerleave` / `focusout` after a 100 ms delay so users can move the pointer into the tooltip to click the button. The 100ms delay is implemented with a `setTimeout` cleared on next `pointerenter`/`focusin`.
   - Tooltip uses `motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150` (tier 1).

4. **Resolve unlocker title from `LocalizedText`.** Use the existing `useResolveLocalizedText()` from `@tour-kit/core` (already imported in `checklist-task.tsx`). Pattern: `const resolveText = useResolveLocalizedText(); const unlockerTitle = resolveText(unlocker.config.title)`.

5. **Test (`packages/checklists/__tests__/locked-task-tooltip.test.tsx`):**
   - Render a `<ChecklistLauncher>` with two tasks: `task-a` (incomplete) and `task-b` (`dependsOn: ['task-a']`, locked).
   - Open the launcher; `userEvent.hover` over `task-b` row.
   - Assert `getByText(/Locked — complete 'Task A' first/)` is in the document.
   - Stub `Element.prototype.scrollIntoView` (`vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})`).
   - Click `getByRole('button', { name: /Go to Task A/ })`.
   - Assert `scrollIntoView` was called once with `{ behavior: 'smooth', block: 'nearest' }`.
   - Assert `document.activeElement` matches the `task-a` row (`[data-tk-task-id="task-a"]`).
   - Assert `task-a` row has `data-tk-highlight="true"`; advance fake timers by 2000ms; assert the attribute is gone.

**Sanity check:** `pnpm --filter @tour-kit/checklists typecheck` exits `0`; the new test file is green; the existing `<ChecklistTask>` snapshot tests stay green (the `data-tk-task-id` attribute addition is the only diff and should be in the snapshot regeneration if applicable).

---

### Task 12.2 — `<HintGroup>` component + `useHintGroupItem` hook (4–6 h)

**Depends on:** 12.1 only insofar as both ship in the same PR; otherwise independent.

Sub-steps:

1. **Create `packages/hints/src/context/hint-group-context.ts`** — internal-only context module.

   ```ts
   import * as React from 'react'

   export interface HintGroupContextValue {
     activeId: string | null
     setActiveId(next: string | null): void
     register(id: string, ref: React.RefObject<HTMLElement | null>): void
     unregister(id: string): void
     focusedIndex: number
     setFocusedIndex(next: number): void
     itemIds: string[]
   }

   export const HintGroupContext = React.createContext<HintGroupContextValue | null>(null)
   ```

2. **Create `packages/hints/src/hooks/use-hint-group-item.ts`** — public hook (export from `packages/hints/src/index.ts`).

   ```ts
   'use client'

   import * as React from 'react'
   import { HintGroupContext } from '../context/hint-group-context'

   export interface UseHintGroupItemReturn {
     isActive: boolean
     isFocused: boolean
     tabIndex: 0 | -1
     domId: string
     setActive(next: string | null): void
     inGroup: boolean
   }

   export function useHintGroupItem(id: string): UseHintGroupItemReturn {
     const ctx = React.useContext(HintGroupContext)
     const itemRef = React.useRef<HTMLElement | null>(null)

     React.useEffect(() => {
       if (!ctx) return
       ctx.register(id, itemRef)
       return () => ctx.unregister(id)
     }, [ctx, id])

     if (!ctx) {
       return {
         isActive: false,
         isFocused: false,
         tabIndex: 0,
         domId: `tk-hint-${id}`,
         setActive: () => {},
         inGroup: false,
       }
     }

     const indexInGroup = ctx.itemIds.indexOf(id)
     return {
       isActive: ctx.activeId === id,
       isFocused: ctx.focusedIndex === indexInGroup,
       tabIndex: ctx.focusedIndex === indexInGroup ? 0 : -1,
       domId: `tk-hint-${id}`,
       setActive: ctx.setActiveId,
       inGroup: true,
     }
   }
   ```

   Critical: the ref is consumer-attached. `<HintHotspot>` accepts a `ref` already; we will forward it from inside the hint render. The registration *carries* the ref so `<HintGroup>` can `.focus()` items on Tab.

3. **Create `packages/hints/src/components/hint-group.tsx`** — public component.

   - State: `activeId`, `focusedIndex` (default `-1`), `itemIds` (derived from `Map` keys, stable order = insertion order).
   - `register(id, ref)` adds to a `useRef<Map<string, RefObject>>` and forces a re-render (via a counter state) to update `itemIds`.
   - `useEffect` on `focusedIndex`: when `focusedIndex >= 0`, call `itemRefsMap.current.get(itemIds[focusedIndex])?.current?.focus()` so DOM focus follows ARIA focus.
   - `useEffect` on first mount: capture `document.activeElement` into `previousFocusRef` (used by Esc to restore).
   - `useEffect` on `activeId` change: call `props.onActiveChange?.(activeId)`.
   - Render: `<div role="group" tabIndex={0} aria-activedescendant={focusedId ? \`tk-hint-${focusedId}\` : undefined} onKeyDown={handleKeyDown} className={cn(className)}>{children}</div>` wrapped in `<HintGroupContext.Provider value={{...}}>`.
   - `handleKeyDown`: implement the exact pattern from the Architecture section above.
   - Initial active: on mount, if `defaultActiveId` is set AND present in `itemIds`, set `activeId = defaultActiveId`. Wrap in a `useEffect` keyed on `defaultActiveId` so registration order doesn't matter.

4. **Patch `<HintHotspot>` to consume `useHintGroupItem`.** In `packages/hints/src/components/hint-hotspot.tsx`:
   - Add a new optional prop `hintGroupId?: string` (the ID used to register with the group; falls back to a `useId()` value if not provided AND inside a group — better: require it when inside a group; throw a dev warning if missing).
   - Inside the component, call `useHintGroupItem(hintGroupId ?? '')`. If `inGroup` is true:
     - Spread `id={item.domId}` on the rendered `<button>`.
     - Spread `tabIndex={item.tabIndex}` (overriding any default).
     - On click, call `item.setActive(item.isActive ? null : hintGroupId!)` BEFORE the existing onClick prop (so the group state flips and only one hint is open at a time).
   - If `inGroup` is false: render exactly as before (v1 path, byte-identical).

   For `<Hint>` (which composes `<HintHotspot>`): no direct changes needed, BUT we need the group-aware open/close to override the local `useHint(id).isOpen` state when inside a group. Cleanest path: when `inGroup === true`, `<Hint>` reads `item.isActive` instead of `useHint(id).isOpen` for the popover render condition. Document this branch with a comment.

5. **Test 1 — single-open invariant + keyboard rotation (`packages/hints/__tests__/hint-group.keyboard.test.tsx`):**
   - Render a `<HintGroup>` with three `<Hint>` children (ids `hint-1`, `hint-2`, `hint-3`).
   - Open `hint-1` by clicking its hotspot — assert `hint-1` content is in the document.
   - Click `hint-2`'s hotspot — assert `hint-2` is open, `hint-1` content is gone.
   - From a focused hotspot, press `Tab` (via `userEvent.tab()`) — assert focus moves to the next hotspot.
   - At the last hotspot, press `Tab` with `loop=true` (default) — assert focus wraps to the first.
   - Press `Escape` — assert no hint content is in the document AND `document.activeElement` is the pre-group element (captured by rendering a `<button>Trigger</button>` before the group, focusing it, then `userEvent.tab` into the group).

6. **Test 2 — a11y scan (`packages/hints/__tests__/hint-group.a11y.test.tsx`):**
   - Render `<HintGroup>` with three `<Hint>` children, one of each Phase 3 variant (`badge`, `beacon-with-label`, `what-s-new-pill`).
   - Run `vitest-axe`: `expect(await axe(container)).toHaveNoViolations()`.
   - Specifically assert no `aria-activedescendant`-related violation and no missing `role` on the group.

**Sanity check:** `pnpm --filter @tour-kit/hints typecheck` exits `0`. Both new test files green. Existing `hint-hotspot.test.tsx` and `hint.test.tsx` stay green without modification (standalone path is byte-identical).

---

### Task 12.3 — Docs page + bundle smoke check (1–2 h)

**Depends on:** 12.1, 12.2.

1. **`apps/docs/content/docs/hints/groups.mdx` (NEW)** — Fumadocs MDX page with three sections:
   - "Composing hints into a group" — `<HintGroup>` example with three `<Hint>` children; live preview; describes the single-open invariant.
   - "Keyboard navigation" — pin the Tab / Shift+Tab / Esc / Enter table; show the `aria-activedescendant` pattern.
   - "Linking locked tasks to their unlockers" — `<ChecklistLauncher>` example with a dependent task; describes the auto-tooltip; shows the `scrollToTask` headless helper.
   - Update `apps/docs/content/docs/hints/meta.json` (or equivalent) to include the `groups` page in the hints sidebar between existing entries.

2. **Bundle delta proof.** Run `pnpm --filter @tour-kit/hints build && gzip -c packages/hints/dist/index.mjs | wc -c` before and after the PR; record the delta in the PR description. Same for checklists. Assert delta `< 3072 bytes` (3 KB) per package. (No CI gate this phase — it is a manual check on the PR; the next phase will add a CI bundle-size budget if drift becomes a problem.)

**Sanity check:** `pnpm --filter docs build` exits `0`; the new MDX page renders in the hints sidebar; bundle deltas recorded in PR.

---

## Deliverables

```
packages/checklists/
├── src/
│   ├── lib/
│   │   └── scroll-to-task.ts                            # NEW — scrollToTask helper + ScrollToTaskOptions
│   ├── components/
│   │   ├── checklist-task.tsx                           # UPDATED — add data-tk-task-id; render locked tooltip when locked + dependsOn + unlocker resolved
│   │   ├── checklist.tsx                                # UPDATED — thread checklistId prop into <ChecklistTask>
│   │   └── checklist-launcher.tsx                       # UPDATED — pass checklistId down (no API change)
│   └── index.ts                                         # UPDATED — re-export scrollToTask + ScrollToTaskOptions
└── __tests__/
    └── locked-task-tooltip.test.tsx                     # NEW — hover/focus shows tooltip; click scrolls + focuses + highlights

packages/hints/
├── src/
│   ├── context/
│   │   └── hint-group-context.ts                        # NEW — internal HintGroupContext + value type
│   ├── components/
│   │   ├── hint-group.tsx                               # NEW — public <HintGroup> component
│   │   └── hint-hotspot.tsx                             # UPDATED — consume useHintGroupItem; group-aware id, tabIndex, click → setActive
│   ├── hooks/
│   │   └── use-hint-group-item.ts                       # NEW — public hook for group-aware children
│   └── index.ts                                         # UPDATED — export HintGroup, HintGroupProps, useHintGroupItem, UseHintGroupItemReturn
└── __tests__/
    ├── hint-group.keyboard.test.tsx                     # NEW — single-open invariant + Tab/Shift+Tab/Esc/Enter
    └── hint-group.a11y.test.tsx                         # NEW — vitest-axe scan on group with 3 Phase 3 variants

apps/docs/content/docs/hints/
├── groups.mdx                                           # NEW — 3 sections: compose, keyboard, locked-task linking
└── meta.json                                            # UPDATED — slot "groups" into the hints sidebar
```

No new dependencies. No `package.json` changes. No provider-architecture changes outside the new `HintGroupContext` (which is internal to `@tour-kit/hints`).

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/checklists typecheck` exits `0`
- [ ] `pnpm --filter @tour-kit/hints typecheck` exits `0`
- [ ] `pnpm --filter @tour-kit/checklists test` exits `0` with `locked-task-tooltip.test.tsx` green and all existing tests still green
- [ ] `pnpm --filter @tour-kit/hints test` exits `0` with `hint-group.keyboard.test.tsx` + `hint-group.a11y.test.tsx` green and all existing tests still green (specifically `hint-hotspot.test.tsx` and `hint.test.tsx` stay green without snapshot regeneration — standalone-hint path is byte-identical)
- [ ] **Locked tooltip — content:** rendering a checklist with `task-b.dependsOn = ['task-a']` and `task-a.completed = false`, hovering `task-b` shows the literal text `"Locked — complete 'Task A title' first"` (RTL `getByText` matches)
- [ ] **Locked tooltip — scroll & focus:** clicking the tooltip's "Go to Task A" button calls `Element.prototype.scrollIntoView` exactly once with `{ behavior: 'smooth', block: 'nearest' }`; `document.activeElement` is the `[data-tk-task-id="task-a"]` node; the node has `data-tk-highlight="true"` for 2000 ms then loses the attribute
- [ ] **Locked tooltip — reduced motion:** under mocked `useReducedMotion → true`, the same click calls `scrollIntoView` with `behavior: 'auto'`
- [ ] **HintGroup — single-open invariant:** opening hint B closes hint A (only one popover in the document at a time across `n` children)
- [ ] **HintGroup — keyboard rotation:** `Tab` advances focus through hotspots in DOM/insertion order; `Shift+Tab` reverses; at the loop edge with `loop=true` (default), focus wraps; `Enter` / `Space` on a focused hotspot opens the corresponding hint
- [ ] **HintGroup — Esc exit:** `Esc` closes any open hint, sets `activeId = null`, and restores focus to the element focused before group entry (captured on first focus-enter)
- [ ] **HintGroup — a11y:** `vitest-axe` reports `0` violations on a group of three children (one of each Phase 3 variant); group wrapper carries `role="group"` and a valid `aria-activedescendant` whenever `focusedIndex >= 0`
- [ ] **HintGroup — composes with Phase 3 variants:** smoke test mounts `<HintGroup>` containing one `<Hint variant="badge">`, one `<Hint variant="beacon-with-label">`, one `<Hint variant="what-s-new-pill">`, asserts all three render and the single-open invariant holds across them
- [ ] **Docs:** `apps/docs/content/docs/hints/groups.mdx` renders in `pnpm --filter docs dev` and is listed in the hints sidebar; `pnpm --filter docs build` exits `0`
- [ ] **Bundle delta:** `@tour-kit/checklists` and `@tour-kit/hints` gzipped `dist/index.mjs` grow by `< 3072` bytes each, recorded in PR description (before/after gzipped byte counts)
- [ ] **Backwards compat:** consumers using `<Hint>` / `<HintHotspot>` outside of a `<HintGroup>` see byte-identical rendered output and behaviour (existing tests stay green; the standalone snapshot in `hint-hotspot.test.tsx` is untouched)

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 12 of Tour Kit v2 Package Polish — **Checklist Dep Viz + HintGroup**. All work is additive; existing consumers see byte-identical behaviour unless they opt in to the new APIs.

### What This Project Is
Tour Kit is a pnpm + Turborepo monorepo of 12 React packages providing headless onboarding/product-tour primitives. Strict TypeScript, ES2020 target, tsup for bundling, vitest for unit tests. This phase touches two packages: `@tour-kit/checklists` (interactive onboarding checklists with task dependencies) and `@tour-kit/hints` (persistent hints/hotspots outside the tour flow). Both packages are styled-on-top-of-headless: thin components compose `@tour-kit/core` hooks.

### Established in Prior Phases (relevant to Phase 12)
- **Phase 3 (complete) locked the `<HintHotspot>` variant contract.** The discriminated-union prop interface lives in `packages/hints/src/components/hint-hotspot.tsx`. `<HintGroup>` MUST work with all three variants without renaming or widening the literal union. Pasted verbatim from Phase 3's contract:

```ts
// packages/hints/src/components/hint-hotspot.tsx — the Phase 3 contract that locks here
type HintHotspotVariantName = 'badge' | 'beacon-with-label' | 'what-s-new-pill'

type HintHotspotVariantExtras =
  | { variant?: undefined }
  | { variant: 'badge'; count?: number }
  | { variant: 'beacon-with-label'; label: string; side?: 'left' | 'right' }
  | { variant: 'what-s-new-pill'; label: string }

export type HintHotspotProps = /* existing base props (targetRect, position, isOpen?, asChild?, className?, onClick?, ref) */ & HintHotspotVariantExtras
```

Your `<HintGroup>` registers items by `id` (a new `hintGroupId?: string` prop you add to `<HintHotspot>`), not by variant. The hotspot reads `useHintGroupItem(hintGroupId)` and adjusts its rendered `id`, `tabIndex`, and click handler accordingly.

- **`@tour-kit/checklists` task-row file:** `packages/checklists/src/components/checklist-task.tsx`. Lines 75–202. The locked render path is already in place (`tabIndex={-1}`, `aria-disabled`, dimmed checkbox). You are extending the `locked === true` branch with a tooltip. The component imports `useReducedMotion` and `useResolveLocalizedText` from `@tour-kit/core` already.

- **`@tour-kit/checklists` task config type:** `packages/checklists/src/types/checklist.ts` lines 59–105.
  - `ChecklistTaskConfig.dependsOn?: string[]` (line 78) — IDs of prerequisite tasks.
  - `ChecklistTaskState` has `{ config, completed, locked, visible, active, completedAt? }`.

- **`@tour-kit/checklists` provider/hook:** `packages/checklists/src/hooks/use-checklist.ts` exposes `tasks` (a `ChecklistTaskState[]` in config order) — your unlocker resolution reads from here.

- **`@tour-kit/checklists` dependency resolver:** `packages/checklists/src/utils/dependencies.ts` already implements `canCompleteTask(task, completedTasks)`. Your unlocker resolution picks the FIRST incomplete + visible dependency from `task.config.dependsOn` — mirrors the existing resolution order. Do NOT re-implement dependency walking; just `.find()` over `task.config.dependsOn`.

- **`@tour-kit/hints` hotspot file:** `packages/hints/src/components/hint-hotspot.tsx`. You patch this to consume `useHintGroupItem`. Existing standalone path stays byte-identical when no `HintGroupContext` is present.

- **`@tour-kit/hints` Hint composition file:** `packages/hints/src/components/hint.tsx`. Lines 52–173. `<Hint>` wraps `<HintHotspot>` + `<HintTooltip>`. When inside a group, it must read `item.isActive` from `useHintGroupItem` instead of `useHint(id).isOpen` for the popover render condition.

- **Existing reduced-motion three-tier defense (cross-package contract, see below) is load-bearing.**

### Your Goal for This Phase
1. **Lock UX in `<ChecklistLauncher>`'s panel:** when a task is locked AND has unresolved `dependsOn`, hover/focus shows a tooltip reading literally `"Locked — complete '<unlocker title>' first"` with a "Go to {unlocker title}" button that calls `scrollToTask(unlockerId)` — smooth-scrolls + focuses + applies a 2-second `data-tk-highlight` attribute to the unlocker row.
2. **`<HintGroup>` component** that enforces a single-open invariant across children and rotates focus via `Tab`/`Shift+Tab` using a roving `tabindex` + `aria-activedescendant` pattern. `Esc` exits and restores prior focus. NO focus trap — hints are advisory, not modal.
3. **Backwards compat:** existing `<Hint>` / `<HintHotspot>` / `<ChecklistTask>` consumers see byte-identical output when not opting in.

### Data Model Rules (follow exactly)
- **`interface` (exported, public):** `HintGroupProps` (in `hint-group.tsx`), `UseHintGroupItemReturn` (in `use-hint-group-item.ts`), `ScrollToTaskOptions` (in `scroll-to-task.ts`).
- **`interface` (internal, not exported beyond the package):** `HintGroupContextValue` (in `hint-group-context.ts`).
- **No new `type` aliases.** Existing types from Phase 3 (`HintHotspotVariantName`, etc.) are unchanged.
- **`useHintGroupItem` returns a no-op shape when called outside a `<HintGroup>`** (`inGroup: false`, `tabIndex: 0`, `setActive: () => {}`). This is the seam that preserves standalone backwards compat.
- **No new dependencies.** `aria-activedescendant` is standard ARIA; smooth-scroll is browser-native; tooltip positioning reuses `@floating-ui/react` (already a `@tour-kit/checklists` dep).
- **Locked tooltip is internal to `<ChecklistTask>`.** Do NOT export a standalone `<LockedTaskTooltip>` component. The behaviour activates when `task.locked === true && task.config.dependsOn?.length > 0 && unlocker !== null`.
- **`<ChecklistTask>` gains a single new optional prop:** `checklistId?: string`, threaded down from `<Checklist>` / `<ChecklistLauncher>`. When absent (headless consumer using `renderTask` directly), the locked tooltip is suppressed.

### Reduced-Motion Three-Tier Defense (cross-package contract, copied verbatim from repo-root CLAUDE.md)

1. **`motion-safe:` Tailwind prefix** on every `tailwindcss-animate` utility (`animate-in`, `fade-*`, `slide-*`, `zoom-*`) in cva variants. Compiles to `@media (prefers-reduced-motion: no-preference)` — under reduce, the utility never applies.
2. **`@media (prefers-reduced-motion: reduce)` keyframe wrappers** for custom `@keyframes` we own. None added this phase.
3. **JS gate via `useReducedMotion()`** from `@tour-kit/core` for render-time class branches or conditional renders. Used in the lock-tooltip's click handler to pass `behavior: 'auto'` to `scrollToTask` under reduce.

### Public APIs (the contracts that lock this phase)

```ts
// packages/hints/src/components/hint-group.tsx
export interface HintGroupProps {
  defaultActiveId?: string
  onActiveChange?(id: string | null): void
  loop?: boolean
  children: React.ReactNode
  className?: string
}

export const HintGroup: React.FC<HintGroupProps>
```

```ts
// packages/hints/src/hooks/use-hint-group-item.ts
export interface UseHintGroupItemReturn {
  isActive: boolean
  isFocused: boolean
  tabIndex: 0 | -1
  domId: string
  setActive(next: string | null): void
  inGroup: boolean
}

export function useHintGroupItem(id: string): UseHintGroupItemReturn
```

```ts
// packages/checklists/src/lib/scroll-to-task.ts
export interface ScrollToTaskOptions {
  behavior?: ScrollBehavior
  block?: ScrollLogicalPosition
  highlightMs?: number
}

export function scrollToTask(taskId: string, options?: ScrollToTaskOptions): boolean
```

### `aria-activedescendant` Keyboard Handler Pattern (paste into `<HintGroup>`)

```tsx
const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  const n = itemIds.length
  if (n === 0) return

  if (e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault()
    const next = loop ? (focusedIndex + 1) % n : Math.min(focusedIndex + 1, n - 1)
    setFocusedIndex(next)
    return
  }
  if (e.key === 'Tab' && e.shiftKey) {
    e.preventDefault()
    const next = loop ? (focusedIndex - 1 + n) % n : Math.max(focusedIndex - 1, 0)
    setFocusedIndex(next)
    return
  }
  if (e.key === 'Escape') {
    // Do not preventDefault — let parent Esc handlers receive it too.
    setActiveId(null)
    setFocusedIndex(-1)
    previousFocusRef.current?.focus()
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    setActiveId(itemIds[focusedIndex] ?? null)
  }
}

// Group container:
<div
  role="group"
  tabIndex={0}
  aria-activedescendant={focusedIndex >= 0 ? `tk-hint-${itemIds[focusedIndex]}` : undefined}
  onKeyDown={handleKeyDown}
  onFocus={(e) => {
    if (previousFocusRef.current === null && e.relatedTarget instanceof HTMLElement) {
      previousFocusRef.current = e.relatedTarget
    }
    if (focusedIndex < 0 && itemIds.length > 0) setFocusedIndex(0)
  }}
  className={cn(className)}
>
  {children}
</div>

// Mirror DOM focus to ARIA focus so screen readers and visual users stay in sync:
React.useEffect(() => {
  if (focusedIndex < 0) return
  const id = itemIds[focusedIndex]
  if (!id) return
  itemRefsMap.current.get(id)?.current?.focus({ preventScroll: true })
}, [focusedIndex, itemIds])
```

### Files to Create / Update

#### `packages/checklists/src/lib/scroll-to-task.ts` (NEW)
Export `scrollToTask(taskId, options?)` per the contract above. Implementation:
- Guard `typeof document === 'undefined'` → return `false` (SSR-safe).
- `document.querySelector<HTMLElement>(\`[data-tk-task-id="${taskId}"]\`)` — return `false` if not found.
- `node.scrollIntoView({ behavior: options?.behavior ?? 'smooth', block: options?.block ?? 'nearest' })`.
- `node.focus({ preventScroll: true })`.
- `node.setAttribute('data-tk-highlight', 'true')`; `window.setTimeout(() => node.removeAttribute('data-tk-highlight'), options?.highlightMs ?? 2000)`.
- Return `true`.

#### `packages/checklists/src/components/checklist-task.tsx` (UPDATED)
- Add `checklistId?: string` to `ChecklistTaskProps`.
- Add `data-tk-task-id={config.id}` to the root `<div>`.
- When `locked === true` and `config.dependsOn && config.dependsOn.length > 0` and `checklistId` is provided:
  - Call `useChecklist(checklistId)` to get `tasks`.
  - Compute `unlocker = tasks.find(t => config.dependsOn!.includes(t.config.id) && !t.completed && t.visible) ?? null`.
  - If `unlocker != null`, render a `@floating-ui/react` tooltip anchored to the row.
  - Tooltip is shown on `pointerenter` / `focusin` of the row, hidden 100 ms after `pointerleave` / `focusout` (cleared on re-enter).
  - Tooltip content: `<p>Locked — complete '{resolveText(unlocker.config.title)}' first</p>` + `<button type="button" onClick={() => scrollToTask(unlocker.config.id, { behavior: reducedMotion ? 'auto' : 'smooth' })}>Go to {resolveText(unlocker.config.title)}</button>`.
  - Tooltip className: `motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150 rounded-md border bg-popover px-3 py-2 text-xs shadow-md`.

#### `packages/checklists/src/components/checklist.tsx` (UPDATED)
- Thread `checklistId` down to each `<ChecklistTask>` render: `<ChecklistTask key={task.config.id} task={task} checklistId={checklistId} ... />`.

#### `packages/checklists/src/components/checklist-launcher.tsx` (no API change)
- No prop change needed; `<Checklist checklistId={checklistId} />` already takes the prop.

#### `packages/checklists/src/index.ts` (UPDATED)
- Add `export { scrollToTask } from './lib/scroll-to-task'`.
- Add `export type { ScrollToTaskOptions } from './lib/scroll-to-task'`.

#### `packages/hints/src/context/hint-group-context.ts` (NEW)
- Export `HintGroupContext` (a `React.createContext<HintGroupContextValue | null>(null)`).
- Export `HintGroupContextValue` interface (do NOT re-export from package index — internal only).

#### `packages/hints/src/hooks/use-hint-group-item.ts` (NEW)
- Export `useHintGroupItem(id)` and `UseHintGroupItemReturn`. Implementation per the Architecture section.
- When context is `null`: return the no-op shape so standalone use is byte-identical.

#### `packages/hints/src/components/hint-group.tsx` (NEW)
- Export `HintGroup` (FC) and `HintGroupProps`.
- Internal state: `activeId` (`useState<string | null>`), `focusedIndex` (`useState<number>` default `-1`), `itemRefsMap` (`useRef<Map<string, RefObject<HTMLElement | null>>>`), `tickState` (`useState<number>` — increments on register/unregister so `itemIds` recompute and re-render).
- Derived: `itemIds = Array.from(itemRefsMap.current.keys())`.
- `register(id, ref)`: `itemRefsMap.current.set(id, ref); setTickState(t => t + 1)`.
- `unregister(id)`: `itemRefsMap.current.delete(id); setTickState(t => t + 1)`.
- `useEffect` on first mount: `previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null`.
- `useEffect` on `defaultActiveId` change: if `defaultActiveId && itemIds.includes(defaultActiveId)` then `setActiveId(defaultActiveId)`.
- `useEffect` on `activeId` change: `props.onActiveChange?.(activeId)`.
- `useEffect` on `focusedIndex` change: `itemRefsMap.current.get(itemIds[focusedIndex])?.current?.focus({ preventScroll: true })`.
- Render the keyboard handler pattern + `<HintGroupContext.Provider value={...}>{children}</HintGroupContext.Provider>` (wrapping the group `<div>`).

#### `packages/hints/src/components/hint-hotspot.tsx` (UPDATED)
- Add `hintGroupId?: string` to `HintHotspotProps` (does NOT widen the Phase 3 discriminated union; it's an extra optional on the base).
- Inside the component: `const item = useHintGroupItem(props.hintGroupId ?? '')`.
- When `item.inGroup === true`:
  - Spread `id={item.domId}` on the rendered `<button>` (or the Slot/UnifiedSlot element).
  - Spread `tabIndex={item.tabIndex}` (this overrides any default `tabIndex`).
  - Wrap the existing `onClick` so it calls `item.setActive(item.isActive ? null : props.hintGroupId!)` BEFORE delegating to the consumer's `onClick`.
- When `item.inGroup === false`: render exactly as Phase 3 / pre-Phase-12 (byte-identical).

#### `packages/hints/src/components/hint.tsx` (UPDATED — small)
- Inside the component, also call `useHintGroupItem(id)` (the `<Hint>`'s `id` is the group item id).
- When `item.inGroup === true`: render the `<HintTooltip>` based on `item.isActive` instead of `useHint(id).isOpen`. Pass `hintGroupId={id}` to `<HintHotspot>` so the hotspot registers with the group under the same id.
- When `item.inGroup === false`: render exactly as before.

#### `packages/hints/src/index.ts` (UPDATED)
- Add `export { HintGroup } from './components/hint-group'`.
- Add `export type { HintGroupProps } from './components/hint-group'`.
- Add `export { useHintGroupItem } from './hooks/use-hint-group-item'`.
- Add `export type { UseHintGroupItemReturn } from './hooks/use-hint-group-item'`.

#### `packages/checklists/__tests__/locked-task-tooltip.test.tsx` (NEW)
Vitest + RTL + `@testing-library/user-event`. ≥3 cases:
1. Render checklist with `task-a` (incomplete, title "Task A title") and `task-b` (`dependsOn: ['task-a']`, locked). Hover `task-b` → assert `getByText(/Locked — complete 'Task A title' first/)` is in the document.
2. Stub `Element.prototype.scrollIntoView` (`vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})`). Click `getByRole('button', { name: /Go to Task A title/ })`. Assert `scrollIntoView` called once with `{ behavior: 'smooth', block: 'nearest' }`. Assert `document.activeElement` is the `[data-tk-task-id="task-a"]` node. Assert that node has `data-tk-highlight="true"`. Advance `vi.useFakeTimers()` by 2000ms; assert the attribute is gone.
3. Mock `useReducedMotion → true`; repeat case 2. Assert `scrollIntoView` was called with `{ behavior: 'auto', block: 'nearest' }`.

#### `packages/hints/__tests__/hint-group.keyboard.test.tsx` (NEW)
Vitest + RTL + `userEvent`. ≥5 cases:
1. Render a `<button>Trigger</button>` then a `<HintGroup>` with three `<Hint>` children (`hint-1`, `hint-2`, `hint-3`). Focus the trigger. Press Tab → assert focus is on `hint-1`'s hotspot.
2. Click `hint-1`'s hotspot → assert `hint-1` content is rendered. Click `hint-2`'s hotspot → assert `hint-2` content is rendered AND `hint-1` content is NOT in the document.
3. With focus on `hint-1`'s hotspot, press Tab → assert focus on `hint-2`. Tab → `hint-3`. Tab → wraps to `hint-1` (default `loop=true`). Shift+Tab → wraps back to `hint-3`.
4. Open `hint-2`. Press Escape. Assert no hint content is in the document. Assert `document.activeElement` is the `Trigger` button.
5. With focus on `hint-2`'s hotspot, press Enter → assert `hint-2` opens (toggles via setActive). Press Enter again → assert `hint-2` closes.

#### `packages/hints/__tests__/hint-group.a11y.test.tsx` (NEW)
Vitest + `vitest-axe`. ≥2 cases:
1. Render `<HintGroup>` with three `<Hint>` children, one of each Phase 3 variant. Run `axe(container)` → assert `toHaveNoViolations()`.
2. Assert the group `<div>` carries `role="group"` and (when `focusedIndex >= 0`) a non-empty `aria-activedescendant` matching `tk-hint-${id}` of the focused item.

#### `apps/docs/content/docs/hints/groups.mdx` (NEW)
Frontmatter `title: HintGroup` + `description: Compose hints into a focused, keyboard-navigable sequence — with a single-open invariant.`. Three H2 sections per Task 12.3. Live preview component for each section (mirror sibling MDX in `apps/docs/content/docs/hints/`).

#### `apps/docs/content/docs/hints/meta.json` (UPDATED)
Slot `"groups"` into the `pages` array between existing entries (place it after `variants` if Phase 3 added that entry).

### Success Criteria
- `pnpm --filter @tour-kit/checklists typecheck` exits 0
- `pnpm --filter @tour-kit/hints typecheck` exits 0
- `pnpm --filter @tour-kit/checklists test` exits 0 with `locked-task-tooltip.test.tsx` green
- `pnpm --filter @tour-kit/hints test` exits 0 with `hint-group.keyboard.test.tsx` + `hint-group.a11y.test.tsx` green
- Locked tooltip click scrolls + focuses + applies `data-tk-highlight` for 2s
- Single-open invariant holds inside `<HintGroup>` across `n` children
- Tab/Shift+Tab rotation + Esc exit + Enter/Space activation all green
- `vitest-axe` reports `0` violations on a group of three children (one per Phase 3 variant)
- `pnpm --filter docs build` exits 0; new MDX renders in sidebar
- Bundle delta `< 3 KB` gzipped per package, recorded in PR description
- Standalone `<Hint>` / `<HintHotspot>` / `<ChecklistTask>` (no group, no dependent task) consumers see byte-identical output — existing tests stay green without snapshot regeneration

### Expected File Structure at End

```
packages/checklists/
├── src/
│   ├── lib/scroll-to-task.ts                            # NEW
│   ├── components/checklist-task.tsx                    # UPDATED
│   ├── components/checklist.tsx                         # UPDATED
│   └── index.ts                                         # UPDATED
└── __tests__/locked-task-tooltip.test.tsx               # NEW

packages/hints/
├── src/
│   ├── context/hint-group-context.ts                    # NEW
│   ├── components/hint-group.tsx                        # NEW
│   ├── components/hint-hotspot.tsx                      # UPDATED
│   ├── components/hint.tsx                              # UPDATED
│   ├── hooks/use-hint-group-item.ts                     # NEW
│   └── index.ts                                         # UPDATED
└── __tests__/
    ├── hint-group.keyboard.test.tsx                     # NEW
    └── hint-group.a11y.test.tsx                         # NEW

apps/docs/content/docs/hints/
├── groups.mdx                                           # NEW
└── meta.json                                            # UPDATED
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 3's `HintHotspotVariantName` literal union + discriminated-union extras are pasted verbatim in the Execution Prompt; the existing `<HintHotspot>` file path (`packages/hints/src/components/hint-hotspot.tsx`) and `<Hint>` file path (`packages/hints/src/components/hint.tsx`) are cited with line ranges. The Phase 6 imperative-ref pattern is not directly consumed here, but the checklist provider + `useChecklist` hook surface (which Phase 6 left untouched) is the read path for unlocker resolution and is verified to exist at `packages/checklists/src/hooks/use-checklist.ts`. `ChecklistTaskConfig.dependsOn` is verified at `packages/checklists/src/types/checklist.ts:78`.
- [PASS] Every sub-task has a clear, testable completion condition — each of 12.1–12.3 ends with a "Sanity check" specifying the shell command + RTL assertion or build command that proves it.
- [PASS] Execution prompt is self-contained — Phase 3 variant interface pasted verbatim; the `aria-activedescendant` keyboard handler pattern pasted inline; the public APIs (`HintGroupProps`, `UseHintGroupItemReturn`, `ScrollToTaskOptions`) pasted inline; per-file implementation guidance covers exact exports, props, and the no-op shape for standalone use; no "see Phase X" references inside the prompt.
- [PASS] Exit criteria map 1:1 to deliverables — fifteen exit checkboxes covering typecheck (×2 packages), tests (×3 new files), locked tooltip content + scroll + reduced-motion behaviour, HintGroup single-open invariant + keyboard rotation + Esc + a11y + variant composition, docs render, bundle delta, and a byte-identity backwards-compat check. Each new/updated file is covered by at least one exit check.
- [PASS] Heavy external deps have a fake/stub strategy noted — no new deps. `Element.prototype.scrollIntoView` is stubbed via `vi.spyOn` in the locked-tooltip test. `useReducedMotion` is mocked via `vi.mock('@tour-kit/core', ...)` for the reduced-motion test. `@floating-ui/react` is already a `@tour-kit/checklists` dep.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — no new libraries this phase. `aria-activedescendant` is a standard ARIA 1.2 pattern (no doc fetch needed); the keyboard handler is paste-ready in the prompt. Smooth scroll is browser-native (`Element.scrollIntoView({ behavior, block })`).
