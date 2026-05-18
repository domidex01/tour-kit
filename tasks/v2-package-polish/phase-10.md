# Phase 10 — AI Panel Polish

**Duration:** Days 52–56 (~9–12 hours)
**Depends on:** Phase 1 task 1.1 — `useTourActions(id)` registry hook in `@tour-kit/core` (signed off + landed; this phase consumes the hook's `goToStep(stepId)` method for the "Open mentioned step" deep-link)
**Blocks:** Nothing directly. Closes the **M6 milestone gate** in `big-plan.md` ("AI panel shows context preview char count + last 3 events; 'open mentioned step' jumps to correct step in a running tour")
**Risk Level:** MEDIUM — three additive enhancements + one prop-shape change. The new `<AiChatContextPreview>` and `<AiMessageActions>` are net-new components (no behaviour to regress). The route-based `suggestions` prop is a breaking shape change from `string[] | boolean` to `Record<string, string[]>`, but the existing `AiChatSuggestionsProps.suggestions: string[]` flat form is preserved as a fallback; the `AiChatPanelProps.showSuggestions: boolean` toggle is deprecated (warn) for one minor cycle. The deep-link parser is the only correctness risk — a bad regex could call `goToStep(undefined)` or jump to a wrong step.
**Stack:** react

---

## Objective

Make `tourContext: true` demonstrable instead of magical. Today the AI panel silently injects tour state into the system prompt; consumers have no way to *see* what was injected, no way to act on the AI's suggestions (e.g., "go to step `welcome-cta`"), and no way to vary suggestion sets per route. Phase 10 ships three additive surfaces in `@tour-kit/ai`:

1. **`<AiChatContextPreview>`** — a collapsible panel below the message list that prints the *resolved* `tourContextValue` (system-prompt char count + the last 3 emitted `AiChatEvent`s). Defaults collapsed; expands on click. Renders nothing when `config.tourContext` is false.
2. **`<AiMessageActions>`** — a hover/long-press action row attached to every assistant message: **Copy** (clipboard write), **Regenerate** (calls `context.reload()`), **Open mentioned step** (scans the message text for `@step:<id>` tokens and calls `useTourActions(tourId).goToStep(stepId)` per Phase 1's registry hook). When no step token is present, the action is suppressed.
3. **Route-based `suggestions={{ '/dashboard': [...], '/help': [...], '*': [...] }}`** on `<AiChatPanel>` — replaces the binary `showSuggestions` toggle (deprecated, kept one minor). The selector picks the suggestion set whose key is the longest prefix match of `usePathname()` (with `'*'` as the universal fallback). Reads pathname via `next/navigation` (already a peer dep of `@tour-kit/ai`'s consumer); a `useCurrentPathname()` hook abstracts the import so non-Next consumers can supply pathname via prop.

All three ship as one PR. Types stay backwards-compatible: `<AiChatPanel showSuggestions={...}>` still works (emits one-time dev warn); the existing `AiChatSuggestionsProps.suggestions: string[]` flat form is preserved as a fallback for consumers who use the suggestions component directly. No new external dependencies — `usePathname()` is Next.js native, clipboard is the browser `navigator.clipboard.writeText` API.

## What Success Looks Like

1. `<AiChatContextPreview defaultExpanded={false} />` rendered inside `<AiChatProvider config={{ tourContext: true, ... }} tourContextValue={tourState}>` renders a collapsed `<details>` element with a summary like `"Tour context — 482 chars, 3 events"` (verified by `getByText(/Tour context — \d+ chars, \d+ events/)`).
2. Clicking the summary expands the panel and reveals: (a) the resolved system-prompt string (the assembled tour-context JSON the server would receive) truncated to 2000 chars with a "show more" toggle; (b) a list of the last 3 `AiChatEvent` entries by `timestamp` desc, each showing `type` + a one-line JSON-stringified `data` (verified by `getAllByRole('listitem')` returning 3 items).
3. `<AiChatContextPreview />` returns `null` when `config.tourContext !== true` (verified by `container.firstChild === null` test).
4. **Copy action:** Clicking `Copy` on an assistant message calls `navigator.clipboard.writeText(message.parts.filter(text).map(text).join(''))` exactly once and shows a transient "Copied" status (`aria-live="polite"`). Asserted via `vi.spyOn(navigator.clipboard, 'writeText')`.
5. **Regenerate action:** Clicking `Regenerate` calls `context.reload()` exactly once (asserted by spying on `reload` from a stubbed `AiChatContextValue`).
6. **Open mentioned step:** A message containing the literal text `"Try clicking the launch button at @step:welcome-cta to continue."` rendered through `<AiMessageActions tourId="welcome">` shows an "Open mentioned step" button; clicking it calls `useTourActions("welcome").goToStep("welcome-cta")` exactly once. When the message contains zero `@step:<id>` tokens, the button is **not** rendered (asserted by `queryByRole('button', { name: /open mentioned step/i }) === null`).
7. **Route-based suggestions switch on route change without remount.** Mount `<AiChatPanel suggestions={{ '/dashboard': ['a'], '/help': ['b'], '*': ['c'] }} />` inside a Next.js `<MemoryRouter>`-style harness (or a `usePathname` mock). Initial pathname `/dashboard` shows suggestion `'a'`; firing a route change to `/help` shows `'b'` without unmounting `<AiChatPanel>` (asserted by capturing the panel's `data-instance-id` data attribute pre/post route change — same value). Falling back to `*` for `/settings/account` shows `'c'`.
8. **Longest-prefix-match selector**: For `suggestions = { '/': [...A], '/dashboard': [...B], '/dashboard/billing': [...C], '*': [...D] }` and `usePathname() === '/dashboard/billing/invoices'`, the selector returns the `'/dashboard/billing'` set (longest matching prefix wins; `'*'` only fires when no key prefix-matches).
9. **Deprecation warn for `showSuggestions`**: Passing `<AiChatPanel showSuggestions={true} />` emits exactly one `console.warn` in dev (`process.env.NODE_ENV !== 'production'`) per page load: `[tour-kit/ai] AiChatPanel.showSuggestions is deprecated — pass suggestions={{ '*': [...] }} or omit to disable. Will be removed in v3.`
10. **Bundle delta <3KB gzipped.** `pnpm --filter @tour-kit/ai build` followed by `gzip -c packages/ai/dist/index.js | wc -c` shows ≤3000 bytes increase over the pre-phase baseline (capture baseline before starting; record in PR description).
11. **All existing AI tests still pass:** `pnpm --filter @tour-kit/ai test -- --run` exits 0 with no regressions; `pnpm --filter @tour-kit/ai typecheck` exits 0.

---

## Architecture / Key Design Decisions

```
                ┌────────────────────────────────────────────────────────────┐
                │  @tour-kit/ai                                              │
                │                                                            │
                │  <AiChatProvider config={{ tourContext: true, ... }}       │
                │                  tourContextValue={tourState}>             │
                │     context.tourContextValue ──────────────────┐           │
                │     context.config           ──────────────────┤           │
                │     event buffer (last N events from onEvent)  │           │
                └────────────────────────────────────────────────┼───────────┘
                                                                 │
                ┌────────────────────────────────────────────────┴───────────┐
                │  <AiChatContextPreview defaultExpanded={false} />          │
                │  reads: context.config.tourContext, context.tourContextValue│
                │         + event buffer (subscribed)                        │
                │  renders: <details><summary>Tour context — N chars,        │
                │             M events</summary> ...resolved JSON + list... │
                │           </details>                                       │
                │  motion-safe: expand/collapse uses native <details>        │
                │               (no CSS transitions, no keyframes added)     │
                └────────────────────────────────────────────────────────────┘

                ┌────────────────────────────────────────────────────────────┐
                │  <AiMessageActions tourId="welcome" message={uiMessage}>   │
                │  parses message text for /@step:([a-z0-9_-]+)/gi tokens    │
                │  renders three buttons:                                    │
                │    [Copy]         → navigator.clipboard.writeText(text)    │
                │    [Regenerate]   → context.reload()                       │
                │    [Open step X]  → useTourActions(tourId).goToStep(X)     │
                │                     (only when ≥1 token matched;           │
                │                      shows the FIRST matched stepId)       │
                └────────────────────────────────────────────────────────────┘

                ┌────────────────────────────────────────────────────────────┐
                │  <AiChatPanel suggestions={{ '/dashboard': [...], ... }} />│
                │  reads pathname via useCurrentPathname()                   │
                │  selector: pickSuggestionsForRoute(suggestions, pathname)  │
                │            → longest-prefix-match; '*' fallback            │
                │  passes the selected string[] to <AiChatSuggestions/>      │
                │  Route changes re-run the selector via usePathname()       │
                │    subscription (Next App Router handles this natively)    │
                └────────────────────────────────────────────────────────────┘
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| `AiChatContextPreviewProps` (public) | `interface` exported from `@tour-kit/ai` | Component prop contract; consumers extend it |
| `MessageAction` (public, custom-action API) | `interface` exported from `@tour-kit/ai` | Lets consumers add their own action buttons alongside the built-in three |
| `AiMessageActionsProps` (public) | `interface` exported from `@tour-kit/ai` | Component prop contract |
| `SuggestionsByRoute` (public) | `type SuggestionsByRoute = Record<string, string[]>` exported from `@tour-kit/ai` | A type alias over a built-in shape; not extended; document the `'*'` fallback key in JSDoc |
| `AiChatPanelProps.suggestions` (was missing → new) | `string[] \| SuggestionsByRoute \| undefined` (union) | Backwards-compat: flat `string[]` still works at the panel level by treating it as `{ '*': string[] }` internally |
| Event buffer (internal) | `const` ring buffer (Array + `unshift`/`slice(0, N)`) | Hot-path object; allocated once per provider instance; not exported |

**Critical rules for this phase:**

- **`useTourActions(tourId)` from `@tour-kit/core`.** Imported per its Phase 1 signed-off signature (pasted verbatim below in the Execution Prompt). Returns a frozen no-op when the tour id is unknown, so `<AiMessageActions tourId="missing-tour">` calls `goToStep` silently and never throws. The wrapping component should not gate on `isActive` — calling `goToStep` on an inactive tour is a documented no-op per Phase 1.
- **`useCurrentPathname()` abstraction.** Wraps `usePathname()` from `next/navigation`. If `next/navigation` is not importable at runtime (non-Next consumer, e.g., Remix/Vite), the hook returns `null`; `pickSuggestionsForRoute(suggestions, null)` returns the `'*'` fallback. Consumers can also pass `pathname` as an explicit prop on `<AiChatPanel pathname={...}>` to bypass the Next dependency entirely.
- **Longest-prefix-match selector is deterministic.** Sort keys by `length` desc once per call (cheap — suggestion maps have ≤20 keys in practice); return the first key where `pathname === key || pathname.startsWith(key + '/')`. Treat `'*'` as the implicit fallback, never as a prefix. This rule is pinned in a snapshot test (`pickSuggestionsForRoute.test.ts`) with ≥8 fixture inputs.
- **Step-id parser regex is pinned.** Use `/@step:([a-z0-9_-]+)/gi`. Step ids must match `[a-z0-9_-]+` per existing `<Tour>` step-id conventions in `@tour-kit/core`. If a consumer uses uppercase or punctuation in step ids, document that the parser is case-insensitive on the prefix but the captured group is preserved as-typed (`.toLowerCase()` is NOT applied to the captured group — it is passed as-is to `goToStep`).
- **Event buffer is in-memory only.** Lives inside `<AiChatProvider>`'s state. Capacity is 50 events (configurable via `<AiChatContextPreview maxEvents={n} />`, default 3 shown / 50 stored). Buffer is reset on provider unmount; not persisted, not synced across tabs.
- **Reduced motion.** No new keyframes. The context-preview expand/collapse uses the native `<details>` element which has no animation by default. If a consumer themes it with a `tailwindcss-animate` utility (e.g., `animate-in fade-in`), the `motion-safe:` prefix already covers it per the cross-package contract in `CLAUDE.md`. The "Copied!" status fade is a CSS `transition-opacity` gated by `motion-safe:` per Tailwind convention. No `useReducedMotion()` JS gate needed.
- **No new Zod schemas.** Phase 10 does not cross an external validation boundary — `SuggestionsByRoute` is consumer-supplied at build time, not parsed from JSON.
- **No new external libraries.** `usePathname()` is Next.js native (peer-optional); `navigator.clipboard.writeText` is web platform. Skip Context7.
- **Deprecation of `showSuggestions` is warn-only.** Keep the prop on `AiChatPanelProps` until v3 (one minor cycle). When both `showSuggestions: false` and `suggestions={...}` are passed, `suggestions` wins; emit a one-time dev warn.

---

## Tasks

### Task 10.1 — `<AiChatContextPreview>` collapsible panel (3–4 h)

Build `packages/ai/src/components/ai-chat-context-preview.tsx` — a collapsible panel that prints the resolved `tourContextValue` (as the server would see it after `assembleTourContext`) plus the last N `AiChatEvent`s.

Public props interface:

```ts
// packages/ai/src/components/ai-chat-context-preview.tsx
export interface AiChatContextPreviewProps {
  /** Whether the panel starts expanded. Default: false. */
  defaultExpanded?: boolean
  /** Max number of events to display (most recent). Default: 3. */
  maxEvents?: number
  /** Max characters of system-prompt JSON to show before "show more" toggle. Default: 2000. */
  maxPromptChars?: number
  /** Custom render override for the expanded body (advanced). */
  renderBody?: (args: { resolvedPrompt: string; events: AiChatEvent[] }) => React.ReactNode
  /** Optional className for the root <details> element. */
  className?: string
}
```

Implementation:

- Read `context = useContext(AiChatContext)`. If `context === null` or `context.config.tourContext !== true`, return `null` (do not throw — the preview is opt-in via the `tourContext` flag).
- Resolve the system-prompt preview by calling `assembleTourContext(context.tourContextValue as TourContextLike | null)` (already exported from `@tour-kit/ai`'s `hooks/use-tour-assistant.ts`) and `JSON.stringify(resolved, null, 2)`. Compute char count = string length.
- Subscribe to the event buffer. The buffer lives in the provider (see Task 10.4 wiring) and exposes `getEvents(n: number): AiChatEvent[]` via the context value (new optional `getEvents` method). If `getEvents` is not present on the context (older provider), fall back to an empty array and emit a one-time dev warn.
- Render a native `<details>` element with `<summary>Tour context — {n} chars, {m} events</summary>`. The `defaultExpanded` prop sets the `open` attribute. Inside the body, render: (a) a `<pre>` with the JSON-stringified resolved prompt, truncated to `maxPromptChars` with a "Show full prompt" button that toggles a local `showFull` state; (b) an `<ol>` of the most recent `maxEvents` events.
- Accessibility: the summary text is the accessible name. Add `aria-live="polite"` to the events list so screen readers announce new entries when the panel is expanded.

**Sanity check:** `pnpm --filter @tour-kit/ai typecheck` exits 0; `pnpm --filter @tour-kit/ai test -- --run ai-chat-context-preview` shows the component renders the summary text and reveals the body on click.

---

### Task 10.2 — `<AiMessageActions>` + step-link parser (4–5 h)

**Depends on:** Phase 1 task 1.1 (`useTourActions(id)` landed in `@tour-kit/core`).

Build `packages/ai/src/components/ai-message-actions.tsx` — a row of action buttons attached to assistant messages.

Public props + custom-action API:

```ts
// packages/ai/src/components/ai-message-actions.tsx
import type { UIMessage } from 'ai'

export interface MessageAction {
  /** Stable id used for keying + analytics. */
  id: string
  /** Visible button label. */
  label: string
  /** Optional aria-label override (defaults to label). */
  ariaLabel?: string
  /** Click handler — receives the assistant message. */
  onSelect: (message: UIMessage) => void
  /** Optional predicate — if returns false, the action is hidden for this message. */
  isAvailable?: (message: UIMessage) => boolean
}

export interface AiMessageActionsProps {
  /** The assistant message this action row belongs to. */
  message: UIMessage
  /** Tour id used by the built-in "Open mentioned step" action; if omitted, the action is suppressed even when @step:<id> is present. */
  tourId?: string
  /** Append custom actions after the built-in three. */
  customActions?: MessageAction[]
  /** Hide one of the built-ins by id ('copy' | 'regenerate' | 'open-step'). */
  hide?: ReadonlyArray<'copy' | 'regenerate' | 'open-step'>
  /** Optional className for the root <div role="toolbar">. */
  className?: string
}
```

Built-in action implementations:

1. **Copy:**
   ```ts
   const text = (message.parts ?? [])
     .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
     .map((p) => p.text)
     .join('')
   await navigator.clipboard.writeText(text)
   setCopiedAt(Date.now())  // local state → triggers a "Copied" status with aria-live="polite"
   ```
   Status text auto-clears after 2 seconds via `setTimeout`. If `navigator.clipboard` is undefined (insecure context / old browser), fall back to a hidden `<textarea> + document.execCommand('copy')` and warn once in dev.

2. **Regenerate:**
   ```ts
   const ctx = useAiChatContext()
   ctx.reload()
   ```
   Disabled when `ctx.status !== 'ready'`. Disabled state has `aria-disabled="true"`.

3. **Open mentioned step:** Parse the assistant message text for `@step:<id>` tokens using the pinned regex:
   ```ts
   const STEP_LINK_RE = /@step:([a-z0-9_-]+)/gi
   function parseStepIds(text: string): string[] {
     const ids: string[] = []
     for (const match of text.matchAll(STEP_LINK_RE)) {
       if (match[1]) ids.push(match[1])
     }
     return ids
   }
   ```
   Use the **first** matched step id. The action button label is `"Open step: {stepId}"`. On click:
   ```ts
   // useTourActions imported from '@tour-kit/core' — see Execution Prompt for verbatim Phase 1 signature
   const actions = useTourActions(tourId ?? '')
   actions.goToStep(firstStepId)
   ```
   When `tourId` is undefined OR `parseStepIds(text).length === 0`, the button is not rendered (returns nothing from the render fn for that action slot).

Render the root as `<div role="toolbar" aria-label="Message actions">` and the buttons as `<button type="button">`. Apply `aria-keyshortcuts="c"` to Copy and `"r"` to Regenerate for keyboard users (optional, behind a feature flag if Storybook a11y tests don't validate it).

Add the actions row to `<AiChatMessage role="assistant">` via a render-prop slot (update `AiChatMessageProps` to accept `actions?: React.ReactNode` — backwards compat, defaults to `null`). Update `<AiChatMessageList>` to pass `<AiMessageActions message={m} tourId={tourId} />` to each assistant message when a new `tourId?: string` prop is passed to the list.

**Sanity check:** `pnpm --filter @tour-kit/ai test -- --run ai-message-actions` exits 0 with ≥5 cases: copy writes to clipboard, regenerate calls `reload`, open-step calls `goToStep` with the parsed id, open-step is hidden when no token, open-step is hidden when `tourId` is undefined.

---

### Task 10.3 — Route-based suggestions selector + `<AiChatPanel>` prop change (2–3 h)

Build `packages/ai/src/lib/route-suggestions.ts` — the longest-prefix-match selector — and update `<AiChatPanel>` to accept the new `suggestions` shape.

Selector:

```ts
// packages/ai/src/lib/route-suggestions.ts
export type SuggestionsByRoute = Record<string, string[]>

/**
 * Pick the suggestion set for a pathname using longest-prefix-match.
 *
 * Rules:
 *   - '*' is the universal fallback (returned when no key prefix-matches).
 *   - A key matches when pathname === key OR pathname.startsWith(key + '/').
 *   - Among matching keys, the longest one wins (deterministic).
 *   - Trailing slashes on keys are normalized: '/dashboard/' is treated as '/dashboard'.
 *   - Returns [] when no key matches and '*' is absent.
 */
export function pickSuggestionsForRoute(
  suggestions: SuggestionsByRoute | string[] | undefined,
  pathname: string | null
): string[] {
  if (!suggestions) return []
  // Flat-array compatibility: treat as { '*': suggestions }
  if (Array.isArray(suggestions)) return suggestions

  if (!pathname) return suggestions['*'] ?? []

  // Normalize keys: strip trailing slash unless key is exactly '/'
  const entries = Object.entries(suggestions)
    .filter(([k]) => k !== '*')
    .map(([k, v]) => [k === '/' ? '/' : k.replace(/\/$/, ''), v] as const)
    // Sort by length desc — longest prefix wins
    .sort((a, b) => b[0].length - a[0].length)

  for (const [key, value] of entries) {
    if (pathname === key || pathname.startsWith(key + '/')) {
      return value
    }
  }
  return suggestions['*'] ?? []
}
```

Pathname adapter:

```ts
// packages/ai/src/hooks/use-current-pathname.ts
'use client'

import { useEffect, useState } from 'react'

let cachedUsePathname: (() => string | null) | null | undefined

function loadUsePathname(): (() => string | null) | null {
  if (cachedUsePathname !== undefined) return cachedUsePathname
  try {
    // Static import would force a hard Next dep; require resolves lazily.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('next/navigation') as { usePathname?: () => string | null }
    cachedUsePathname = typeof mod.usePathname === 'function' ? mod.usePathname : null
  } catch {
    cachedUsePathname = null
  }
  return cachedUsePathname
}

/**
 * Returns the current pathname from Next App Router when available.
 * Returns null in non-Next environments — consumers can pass an explicit
 * pathname prop to <AiChatPanel> as a fallback.
 */
export function useCurrentPathname(): string | null {
  const usePathnameFn = loadUsePathname()
  if (usePathnameFn) {
    // SAFETY: cached function reference is stable across renders → calling it here is rules-of-hooks-safe.
    return usePathnameFn()
  }
  // Non-Next fallback: subscribe to window.location.pathname
  const [pathname, setPathname] = useState<string | null>(
    typeof window === 'undefined' ? null : window.location.pathname
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])
  return pathname
}
```

Update `<AiChatPanel>` (`packages/ai/src/components/ai-chat-panel.tsx`):

- Add `suggestions?: string[] | SuggestionsByRoute` and `pathname?: string` props to `AiChatPanelProps`.
- Deprecate `showSuggestions: boolean` with a one-time dev warn (`process.env.NODE_ENV !== 'production'`) using a module-level `warned` boolean.
- Inside the component, compute `const resolvedPath = pathname ?? useCurrentPathname()` and `const selected = pickSuggestionsForRoute(suggestions, resolvedPath)`.
- When `selected.length > 0` (or legacy `showSuggestions === true` with `config.suggestions.static`), render `<AiChatSuggestions suggestions={selected} />`. Otherwise omit the suggestions block.
- The pathname change triggers a re-render via Next's `usePathname` subscription (App Router built-in); no extra subscription needed.

Update `packages/ai/src/index.ts` to re-export `pickSuggestionsForRoute`, `SuggestionsByRoute`, `useCurrentPathname`.

**Sanity check:** `pnpm --filter @tour-kit/ai test -- --run route-suggestions` exits 0 with ≥8 fixture cases (universal `*`, exact match, longest-prefix wins over short prefix, trailing slash normalization, nested deep path, no-match returns fallback, flat-array passthrough, null pathname returns `*`). `pnpm --filter @tour-kit/ai test -- --run ai-chat-panel-route` shows the suggestions list swaps content when `usePathname` mock returns a new value without unmounting the panel (compare a stable `useId`-generated value across the route-change boundary).

---

### Task 10.4 — Provider event buffer + docs page (1–2 h)

**Depends on:** 10.1 (consumer of the buffer)

Update `packages/ai/src/context/ai-chat-provider.tsx` to maintain a fixed-capacity event buffer:

- At provider scope, declare `const eventBufferRef = useRef<AiChatEvent[]>([])` and a capacity constant `const EVENT_BUFFER_CAPACITY = 50`.
- Wrap the existing `onEvent` consumer call (if present) so the provider unshifts every emitted event into the buffer and trims to capacity: `eventBufferRef.current = [event, ...eventBufferRef.current].slice(0, EVENT_BUFFER_CAPACITY)`. Bump a `bufferVersion` state value so subscribers (`<AiChatContextPreview>`) re-render.
- Expose `getEvents(n: number): AiChatEvent[]` on the context value (new optional method): `return eventBufferRef.current.slice(0, n)`.

Update `AiChatContextValue` (`packages/ai/src/context/ai-chat-context.ts`):

```ts
export interface AiChatContextValue {
  // ... existing fields
  /** Read the last N AiChatEvent entries from the in-memory ring buffer (capacity 50). */
  getEvents?(n: number): AiChatEvent[]
}
```

Mark `getEvents` optional so external mocks of the context (e.g., older test fixtures) don't break.

Create `apps/docs/content/docs/ai/context-preview.mdx` with three H2 sections:

1. **Showing what `tourContext: true` injects** — code block rendering `<AiChatContextPreview />`; explain the char count + last-3-events summary.
2. **Acting on assistant suggestions with `<AiMessageActions>`** — code block for `<AiMessageActions tourId="welcome" message={m} />`; explain the `@step:<id>` token convention and the Phase 1 `useTourActions(tourId).goToStep(stepId)` integration.
3. **Route-based suggestions** — code block for `<AiChatPanel suggestions={{ '/dashboard': [...], '/help': [...], '*': [...] }} />`; explain longest-prefix-match and the `'*'` fallback; note the `showSuggestions` deprecation.

Frontmatter:
```yaml
title: AI panel polish
description: Show the resolved tour context, act on AI suggestions, and vary prompts by route.
```

Update `apps/docs/content/docs/ai/meta.json` so the new page appears in the AI sidebar after the existing `getting-started.mdx`.

**Sanity check:** `pnpm --filter @tour-kit/ai typecheck` exits 0; `pnpm --filter docs build` exits 0 and the page is reachable at `/docs/ai/context-preview`.

---

## Deliverables

```
packages/ai/
├── src/
│   ├── components/
│   │   ├── ai-chat-context-preview.tsx           # NEW — collapsible <details> panel; reads context.tourContextValue + getEvents()
│   │   ├── ai-message-actions.tsx                # NEW — Copy/Regenerate/Open-step toolbar; uses useTourActions(tourId).goToStep
│   │   ├── ai-chat-message.tsx                   # UPDATED — accepts optional `actions?: ReactNode` slot
│   │   ├── ai-chat-message-list.tsx              # UPDATED — accepts optional `tourId?: string`; renders <AiMessageActions> for assistant messages
│   │   └── ai-chat-panel.tsx                     # UPDATED — `suggestions?: string[] | SuggestionsByRoute`; `pathname?: string`; `showSuggestions` deprecated with one-time warn
│   ├── hooks/
│   │   └── use-current-pathname.ts               # NEW — Next-aware pathname adapter; null fallback for non-Next
│   ├── lib/
│   │   └── route-suggestions.ts                  # NEW — pickSuggestionsForRoute selector + SuggestionsByRoute type
│   ├── context/
│   │   ├── ai-chat-context.ts                    # UPDATED — AiChatContextValue gains optional getEvents(n): AiChatEvent[]
│   │   └── ai-chat-provider.tsx                  # UPDATED — event ring buffer (capacity 50) + getEvents() impl
│   ├── __tests__/
│   │   ├── route-suggestions.test.ts             # NEW — ≥8 fixture cases for selector
│   │   ├── ai-chat-context-preview.test.tsx      # NEW — renders summary, expands, returns null when tourContext=false
│   │   ├── ai-message-actions.test.tsx           # NEW — Copy/Regenerate/Open-step behaviour incl. parser fixtures
│   │   └── ai-chat-panel-route.test.tsx          # NEW — route change swaps suggestions without panel remount
│   └── index.ts                                  # UPDATED — re-exports new components + lib + hook + types
└── package.json                                  # UPDATED — bump to v2.0.0 (suggestions prop shape change) with backwards-compat fallback for flat string[]

apps/docs/
└── content/docs/ai/
    ├── context-preview.mdx                       # NEW — 3 H2 sections, runnable code blocks
    └── meta.json                                 # UPDATED — sidebar entry
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/ai typecheck` exits 0
- [ ] `pnpm --filter @tour-kit/ai build` exits 0
- [ ] `pnpm --filter @tour-kit/ai test -- --run` exits 0 with all new test files passing and zero regressions on existing tests
- [ ] `pnpm --filter @tour-kit/ai test -- --run route-suggestions` exits 0 with ≥8 cases covering: universal `*` fallback, exact match (`'/dashboard'` vs `'/dashboard'`), longest-prefix wins (`'/dashboard/billing'` beats `'/dashboard'` for `'/dashboard/billing/x'`), trailing slash normalization (`'/dashboard/'` matches `'/dashboard'`), nested 3-level path, no-match returns `*`, flat-array passthrough (treated as `{ '*': arr }`), null pathname returns `*`
- [ ] `pnpm --filter @tour-kit/ai test -- --run ai-chat-context-preview` exits 0 with ≥4 cases: renders summary with char count + event count; expands on click; returns null when `config.tourContext !== true`; "show more" toggle reveals full prompt when truncated
- [ ] `pnpm --filter @tour-kit/ai test -- --run ai-message-actions` exits 0 with ≥5 cases: Copy writes to clipboard (spy assertion); Regenerate calls `context.reload`; Open-step calls `useTourActions(tourId).goToStep(stepId)` with the FIRST parsed token; Open-step hidden when no `@step:` token; Open-step hidden when `tourId` undefined
- [ ] `pnpm --filter @tour-kit/ai test -- --run ai-chat-panel-route` exits 0 with ≥2 cases: route change swaps suggestion content without panel remount (data-instance-id stable across route change); `'*'` fallback fires when no key prefix-matches
- [ ] Deprecation warn for `showSuggestions` fires exactly once per page load (asserted via `vi.spyOn(console, 'warn')`); zero warns in production builds
- [ ] Bundle delta ≤3KB gzipped: `gzip -c packages/ai/dist/index.js | wc -c` minus the captured pre-phase baseline ≤3000 bytes (record both numbers in the PR description)
- [ ] `pnpm --filter docs build` exits 0 and `apps/docs/content/docs/ai/context-preview.mdx` renders in the AI sidebar
- [ ] `packages/ai/src/index.ts` re-exports `AiChatContextPreview`, `AiChatContextPreviewProps`, `AiMessageActions`, `AiMessageActionsProps`, `MessageAction`, `pickSuggestionsForRoute`, `SuggestionsByRoute`, `useCurrentPathname` (grep `index.ts` for each symbol)
- [ ] `<AiChatContextPreview>` integration test: rendered inside `<AiChatProvider config={{ tourContext: true }} tourContextValue={mockTourState}>`, the summary text matches `/Tour context — \d+ chars, \d+ events/` and 3 events appear in the `<ol>` after expand

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 10 of Tour Kit v2 Package Polish — AI Panel Polish.

### What This Project Is
Tour Kit is a pnpm monorepo of 12 packages providing headless React product-tour primitives (core, react, hints) plus pro packages (announcements, surveys, checklists, adoption, analytics, ai, scheduling, license, media). v2 closes demo-wiring gaps reported while building `examples/dashboard-next/`. Every phase ships as one PR with backwards-compatible types where feasible. Stack: TypeScript strict mode, React 18+, tsup, Turborepo, Vitest, pnpm. The `@tour-kit/ai` package is currently at v1.x with a binary `showSuggestions: boolean` toggle and a magical `config.tourContext: true` flag that injects tour state with no consumer-visible surface; Phase 10 ships three additive UI components (`<AiChatContextPreview>`, `<AiMessageActions>`) and one prop-shape evolution (`suggestions: Record<string, string[]>`).

### Established in Prior Phases
- **Phase 1 task 1.1** (already merged) landed `useTourActions(id)` in `@tour-kit/core` — a module-level registry hook with `useSyncExternalStore`. Standalone `<Tour id="...">` instances self-register at mount. The hook returns a frozen no-op object when the tour id is unknown (does NOT throw). The full signed-off signature is pasted below under "Confirmed Library APIs" — use that signature verbatim.
- **`config.tourContext: true`** is already wired in `<AiChatProvider>` (`packages/ai/src/context/ai-chat-provider.tsx` lines 96–100): when the flag is set, the provider reads `tourContextValue` from the `tourContextValue` prop and exposes it on `AiChatContext.tourContextValue: unknown`.
- **`assembleTourContext(tourState)`** is already exported from `@tour-kit/ai`'s `hooks/use-tour-assistant.ts` — it returns a `TourAssistantContext` shape with `activeTour`, `activeStep`, `completedTours`, `checklistProgress`. Phase 10's context-preview reuses this function to render the resolved system-prompt JSON.
- **`AiChatEvent`** is the event type emitted via `config.onEvent` — defined in `packages/ai/src/types/events.ts` as `{ type: AiChatEventType; data: Record<string, unknown>; timestamp: Date }`. Phase 10 adds an in-memory ring buffer (capacity 50) inside `<AiChatProvider>` and exposes `getEvents(n: number): AiChatEvent[]` on the context.
- **`<AiChatSuggestions>`** already accepts a flat `suggestions: string[]` prop and falls back to `config.suggestions.static` when omitted. The new `<AiChatPanel>` route-based suggestions feature filters the array and passes the result to `<AiChatSuggestions>` — the suggestions component itself is unchanged.
- **No new external dependencies.** `usePathname()` is Next.js native (peer-optional via `require('next/navigation')`); clipboard is `navigator.clipboard.writeText`.

### Signed-off Signatures (verbatim from Phase 1 §1.1)

```ts
// packages/core/src/types/registry.ts — UseTourActionsReturn (Phase 1 §1.1, signed off)
export interface UseTourActionsReturn {
  // Minimal state slice (read-only mirror of registry)
  isActive: boolean
  currentStepId: string | null
  progress: number // 0..1

  // Imperative actions — every method is a no-op if the tour is not registered
  start: () => void
  stop: () => void
  restart: () => void
  next: () => void
  prev: () => void
  goToStep: (stepId: string) => void
}

/**
 * Read/control a tour from anywhere in the React tree, including siblings of
 * the <Tour> instance. Standalone <Tour id="..."> components self-register at
 * mount via the tour registry. Returns a frozen no-op object when the tour id
 * is unknown — does NOT throw, so call sites stay quiet during route transitions.
 */
export function useTourActions(tourId: string): UseTourActionsReturn
```

**Critical:** the method name is `goToStep` (not `goTo`). Phase 10's "Open mentioned step" action calls `useTourActions(tourId).goToStep(stepId)`. When `tourId` is unknown, the frozen no-op silently consumes the call — do NOT add a guard for this in `<AiMessageActions>`.

### Your Goal for This Phase
Ship three additive surfaces in `@tour-kit/ai` plus a docs page:

1. **`<AiChatContextPreview>`** — a collapsible `<details>` panel that prints the resolved tour-context JSON (via `assembleTourContext`) and the last 3 `AiChatEvent`s. Renders nothing when `config.tourContext !== true`.
2. **`<AiMessageActions>`** — a toolbar of Copy / Regenerate / "Open mentioned step" buttons attached to assistant messages. Parses `@step:<id>` tokens with the regex `/@step:([a-z0-9_-]+)/gi`, uses the first match, and calls `useTourActions(tourId).goToStep(firstStepId)`. Supports a `customActions: MessageAction[]` API for consumer-added actions.
3. **Route-based `suggestions` on `<AiChatPanel>`** — replace the binary `showSuggestions` toggle (deprecate, warn-once) with `suggestions?: string[] | SuggestionsByRoute` where `SuggestionsByRoute = Record<string, string[]>`. Pick the active set via longest-prefix-match against `usePathname()` from `next/navigation` (with `'*'` as universal fallback). Non-Next consumers can pass an explicit `pathname` prop.
4. **Docs page** at `apps/docs/content/docs/ai/context-preview.mdx` with three H2 sections covering all three features.

Bundle delta budget: ≤3KB gzipped on `packages/ai/dist/index.js`. Capture baseline before starting.

### Data Model Rules (follow exactly)
- **`interface` (exported from main):** `AiChatContextPreviewProps`, `AiMessageActionsProps`, `MessageAction` live in their respective component files and are re-exported via `src/index.ts`.
- **`type` alias (exported from main):** `SuggestionsByRoute = Record<string, string[]>` lives in `packages/ai/src/lib/route-suggestions.ts` and is re-exported. JSDoc documents the `'*'` fallback convention.
- **Union types on props:** `AiChatPanelProps.suggestions: string[] | SuggestionsByRoute | undefined` — flat array compatibility is handled by `pickSuggestionsForRoute` treating `Array.isArray(suggestions)` as `{ '*': suggestions }`.
- **No new Zod schemas.** `SuggestionsByRoute` is consumer-supplied at build time.
- **No new external libraries.** `usePathname()` via lazy `require('next/navigation')` (try/catch); clipboard via `navigator.clipboard.writeText` with `document.execCommand('copy')` fallback in insecure contexts.
- **Event buffer is a ref-backed array, not state.** `useRef<AiChatEvent[]>([])` inside `<AiChatProvider>`; bump a separate `bufferVersion` state to trigger subscriber re-renders. Capacity 50.
- **Step-id parser regex is pinned in a comment at module scope of `ai-message-actions.tsx`.** `STEP_LINK_RE = /@step:([a-z0-9_-]+)/gi`. Document the case-insensitive prefix + case-preserving capture group in JSDoc.

### Architecture

```
@tour-kit/ai (main entry — additive only; no breaking removals)

src/components/ai-chat-context-preview.tsx   ← collapsible <details>; reads context.tourContextValue + getEvents()
src/components/ai-message-actions.tsx        ← toolbar; calls useTourActions(tourId).goToStep(firstStepId) for @step tokens
src/components/ai-chat-message.tsx           ← accepts new optional `actions?: ReactNode` slot
src/components/ai-chat-message-list.tsx      ← accepts new optional `tourId?: string`; renders <AiMessageActions> for assistant msgs
src/components/ai-chat-panel.tsx             ← suggestions: string[] | SuggestionsByRoute; pathname?: string; showSuggestions deprecated
src/lib/route-suggestions.ts                 ← pickSuggestionsForRoute(suggestions, pathname) — longest-prefix-match
src/hooks/use-current-pathname.ts            ← lazy require('next/navigation').usePathname; window.location fallback
src/context/ai-chat-context.ts               ← AiChatContextValue gains optional getEvents(n): AiChatEvent[]
src/context/ai-chat-provider.tsx             ← event ring buffer (capacity 50) + getEvents() impl
src/index.ts                                 ← re-exports new components + types + selector + hook

apps/docs/content/docs/ai/
  context-preview.mdx                        ← new guide page (3 H2 sections)
  meta.json                                  ← sidebar entry
```

### Confirmed Library APIs

**`useTourActions(id)` from `@tour-kit/core` (Phase 1, already shipped):**

```ts
// Import path
import { useTourActions, type UseTourActionsReturn } from '@tour-kit/core'

// Usage inside <AiMessageActions>:
function OpenStepButton({ tourId, stepId }: { tourId: string; stepId: string }) {
  const actions = useTourActions(tourId)
  // actions is ALWAYS a frozen object — never null. When tourId is unknown,
  // all methods are no-ops; do not gate on isActive.
  return (
    <button
      type="button"
      onClick={() => actions.goToStep(stepId)}
      aria-label={`Open step: ${stepId}`}
    >
      Open step: {stepId}
    </button>
  )
}
```

**`assembleTourContext` from `@tour-kit/ai` (already exported):**

```ts
// Import path
import { assembleTourContext, type TourAssistantContext } from '@tour-kit/ai'

// Usage inside <AiChatContextPreview>:
const ctx = useContext(AiChatContext)
const tourContextValue = ctx?.tourContextValue as TourContextLike | null | undefined
const resolved = assembleTourContext(tourContextValue)
const json = JSON.stringify(resolved, null, 2)
const charCount = json.length
```

**Longest-prefix-match selector (paste this verbatim into `src/lib/route-suggestions.ts`):**

```ts
export type SuggestionsByRoute = Record<string, string[]>

/**
 * Pick the suggestion set for a pathname using longest-prefix-match.
 *
 * Rules:
 *   - '*' is the universal fallback (returned when no key prefix-matches).
 *   - A key matches when pathname === key OR pathname.startsWith(key + '/').
 *   - Among matching keys, the longest one wins (deterministic).
 *   - Trailing slashes on keys are normalized: '/dashboard/' is treated as '/dashboard'.
 *   - Returns [] when no key matches and '*' is absent.
 */
export function pickSuggestionsForRoute(
  suggestions: SuggestionsByRoute | string[] | undefined,
  pathname: string | null
): string[] {
  if (!suggestions) return []
  // Flat-array compatibility: treat as { '*': suggestions }
  if (Array.isArray(suggestions)) return suggestions

  if (!pathname) return suggestions['*'] ?? []

  // Normalize keys: strip trailing slash unless key is exactly '/'
  const entries = Object.entries(suggestions)
    .filter(([k]) => k !== '*')
    .map(([k, v]) => [k === '/' ? '/' : k.replace(/\/$/, ''), v] as const)
    // Sort by length desc — longest prefix wins
    .sort((a, b) => b[0].length - a[0].length)

  for (const [key, value] of entries) {
    if (pathname === key || pathname.startsWith(key + '/')) {
      return value
    }
  }
  return suggestions['*'] ?? []
}
```

**`useCurrentPathname` adapter (paste verbatim into `src/hooks/use-current-pathname.ts`):**

```ts
'use client'

import { useEffect, useState } from 'react'

let cachedUsePathname: (() => string | null) | null | undefined

function loadUsePathname(): (() => string | null) | null {
  if (cachedUsePathname !== undefined) return cachedUsePathname
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('next/navigation') as { usePathname?: () => string | null }
    cachedUsePathname = typeof mod.usePathname === 'function' ? mod.usePathname : null
  } catch {
    cachedUsePathname = null
  }
  return cachedUsePathname
}

export function useCurrentPathname(): string | null {
  const usePathnameFn = loadUsePathname()
  if (usePathnameFn) return usePathnameFn()

  // Non-Next fallback: window.location.pathname with popstate subscription
  const [pathname, setPathname] = useState<string | null>(
    typeof window === 'undefined' ? null : window.location.pathname
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])
  return pathname
}
```

**Step-id parser (paste verbatim into `src/components/ai-message-actions.tsx`):**

```ts
// Step-link convention: assistant messages may reference a step via "@step:<id>"
// where <id> matches Tour Kit's step-id grammar [a-z0-9_-]+. The regex is
// case-insensitive on the prefix (@Step:, @STEP:) but preserves the captured
// group case-as-typed (passed to useTourActions(tourId).goToStep verbatim).
export const STEP_LINK_RE = /@step:([a-z0-9_-]+)/gi

export function parseStepIds(text: string): string[] {
  const ids: string[] = []
  for (const match of text.matchAll(STEP_LINK_RE)) {
    if (match[1]) ids.push(match[1])
  }
  return ids
}
```

**Public interfaces (paste verbatim into the respective component files):**

```ts
// packages/ai/src/components/ai-chat-context-preview.tsx
export interface AiChatContextPreviewProps {
  defaultExpanded?: boolean       // default: false
  maxEvents?: number              // default: 3
  maxPromptChars?: number         // default: 2000
  renderBody?: (args: { resolvedPrompt: string; events: AiChatEvent[] }) => React.ReactNode
  className?: string
}

// packages/ai/src/components/ai-message-actions.tsx
import type { UIMessage } from 'ai'

export interface MessageAction {
  id: string
  label: string
  ariaLabel?: string
  onSelect: (message: UIMessage) => void
  isAvailable?: (message: UIMessage) => boolean
}

export interface AiMessageActionsProps {
  message: UIMessage
  tourId?: string
  customActions?: MessageAction[]
  hide?: ReadonlyArray<'copy' | 'regenerate' | 'open-step'>
  className?: string
}
```

### Files to Create / Update

#### `packages/ai/src/lib/route-suggestions.ts` (NEW)
Export `pickSuggestionsForRoute` and `SuggestionsByRoute` exactly as shown in "Confirmed Library APIs" above. Pure module — no React imports. Add a JSDoc block above `pickSuggestionsForRoute` listing all four rules (universal `*`, prefix match, longest wins, trailing slash normalization).

#### `packages/ai/src/hooks/use-current-pathname.ts` (NEW)
Paste the `useCurrentPathname` adapter verbatim from "Confirmed Library APIs". Important: the lazy `require('next/navigation')` must be wrapped in try/catch so non-Next consumers (Remix, Vite, vanilla React) get `null` back without a build-time error. Mark with `'use client'` directive.

#### `packages/ai/src/components/ai-chat-context-preview.tsx` (NEW)
Component reading `useContext(AiChatContext)`. Return `null` early when `context === null` OR `context.config.tourContext !== true`. Call `assembleTourContext(context.tourContextValue as TourContextLike | null)` and `JSON.stringify(resolved, null, 2)` to compute the prompt preview; char count = string length. Read events via `context.getEvents?.(maxEvents ?? 3) ?? []`; emit a one-time dev warn if `getEvents` is undefined. Render a native `<details>` with `open={defaultExpanded}` attribute, a `<summary>` showing `Tour context — {chars} chars, {events.length} events`, and a body containing (a) a `<pre>` with the prompt truncated to `maxPromptChars` + a "Show full prompt" toggle, (b) an `<ol aria-live="polite">` of events. Apply `motion-safe:transition-opacity` only — no custom keyframes. Use `cn()` from `@tour-kit/core` for className composition.

#### `packages/ai/src/components/ai-message-actions.tsx` (NEW)
Paste the `STEP_LINK_RE`, `parseStepIds`, and `MessageAction` / `AiMessageActionsProps` interfaces from "Confirmed Library APIs". Inside the component, read `ctx = useAiChatContext()`, compute `text = (message.parts ?? []).filter(text-parts).map(p => p.text).join('')`, compute `stepIds = parseStepIds(text)`, and call `actions = useTourActions(tourId ?? '')` unconditionally (the hook handles unknown ids by returning the frozen no-op). Build the actions array as the three built-ins + `customActions`, then filter via `!hide?.includes(id)` and `(action.isAvailable?.(message) ?? true)`. Built-in `open-step` is only included when `tourId !== undefined && stepIds.length > 0`. Render the row as `<div role="toolbar" aria-label="Message actions">`. Copy uses `navigator.clipboard.writeText(text)` wrapped in try/catch with a `document.execCommand('copy')` fallback via a hidden textarea. After a successful copy, set a local `copiedAt = Date.now()` state and render a `<span aria-live="polite">Copied</span>` that clears after 2000ms via `setTimeout`. Regenerate disables when `ctx.status !== 'ready'` (`aria-disabled="true"`).

#### `packages/ai/src/components/ai-chat-message.tsx` (UPDATED)
Add `actions?: React.ReactNode` to `AiChatMessageProps`. Render `actions` directly after `children` inside the message div. Backwards compat: `actions` defaults to `undefined` and renders nothing.

#### `packages/ai/src/components/ai-chat-message-list.tsx` (UPDATED)
Add `tourId?: string` to `AiChatMessageListProps`. For each `message` with `role === 'assistant'`, pass `actions={<AiMessageActions message={message} tourId={tourId} />}` to `<AiChatMessage>`. Skip the actions row for `role === 'user'` messages.

#### `packages/ai/src/components/ai-chat-panel.tsx` (UPDATED)
Add `suggestions?: string[] | SuggestionsByRoute` and `pathname?: string` to `AiChatPanelProps`. Keep `showSuggestions?: boolean` but mark `@deprecated` in JSDoc. Inside the component:
1. At module scope, declare `let deprecationWarned = false`.
2. In the render body, if `showSuggestions !== undefined && process.env.NODE_ENV !== 'production' && !deprecationWarned`, call `console.warn('[tour-kit/ai] AiChatPanel.showSuggestions is deprecated — pass suggestions={{ \'*\': [...] }} or omit to disable. Will be removed in v3.')` and set `deprecationWarned = true`.
3. Compute `const resolvedPath = pathname ?? useCurrentPathname()` (call `useCurrentPathname` unconditionally to keep rules-of-hooks satisfied; the prop just overrides the return value).
4. Compute `const selected = pickSuggestionsForRoute(suggestions, resolvedPath)`. When `selected.length > 0`, render `<AiChatSuggestions suggestions={selected} className="px-0 pb-2" />`. Otherwise omit. Legacy `showSuggestions === true` continues to render `<AiChatSuggestions />` (reads `config.suggestions.static`) for backwards compat when `suggestions` prop is undefined.

#### `packages/ai/src/context/ai-chat-context.ts` (UPDATED)
Add optional `getEvents?(n: number): AiChatEvent[]` to `AiChatContextValue`. Update the JSDoc on the interface to mention the new ring buffer.

#### `packages/ai/src/context/ai-chat-provider.tsx` (UPDATED)
Add `const eventBufferRef = useRef<AiChatEvent[]>([])` and `const [bufferVersion, setBufferVersion] = useState(0)` at the top of the component. Wrap the existing `onEvent` consumer hook (or add one if absent — the provider already accepts `config.onEvent`): on every emitted event, do `eventBufferRef.current = [event, ...eventBufferRef.current].slice(0, 50)` and `setBufferVersion(v => v + 1)`. Expose `getEvents: (n: number) => eventBufferRef.current.slice(0, n)` on the context value (include in the `useMemo` deps array — depend on `bufferVersion` so consumers re-render).

#### `packages/ai/src/index.ts` (UPDATED)
Re-export `AiChatContextPreview`, `AiChatContextPreviewProps`, `AiMessageActions`, `AiMessageActionsProps`, `MessageAction`, `pickSuggestionsForRoute`, `SuggestionsByRoute`, `useCurrentPathname`. Existing exports remain unchanged.

#### `packages/ai/package.json` (UPDATED)
Bump `version` to `2.0.0` (the `<AiChatPanel>` prop-shape evolution from `showSuggestions: boolean` to `suggestions: string[] | SuggestionsByRoute` is technically a backwards-compatible add — flat `string[]` still works at the panel level via the array-passthrough rule — but the deprecation of `showSuggestions` warrants a major to give consumers a clear migration cycle).

#### `packages/ai/src/__tests__/route-suggestions.test.ts` (NEW)
≥8 fixture cases. Examples:
1. `pickSuggestionsForRoute({ '*': ['fallback'] }, null)` → `['fallback']`
2. `pickSuggestionsForRoute({ '/dashboard': ['d'], '*': ['f'] }, '/dashboard')` → `['d']` (exact match)
3. `pickSuggestionsForRoute({ '/': ['root'], '/dashboard': ['d'], '/dashboard/billing': ['b'], '*': ['f'] }, '/dashboard/billing/invoices')` → `['b']` (longest prefix wins)
4. `pickSuggestionsForRoute({ '/dashboard/': ['d'] }, '/dashboard')` → `['d']` (trailing slash normalized)
5. `pickSuggestionsForRoute({ '/dashboard': ['d'] }, '/help')` → `[]` (no match, no fallback)
6. `pickSuggestionsForRoute({ '/dashboard': ['d'], '*': ['f'] }, '/help')` → `['f']` (fallback fires)
7. `pickSuggestionsForRoute(['a', 'b', 'c'], '/anywhere')` → `['a', 'b', 'c']` (flat-array passthrough)
8. `pickSuggestionsForRoute(undefined, '/anywhere')` → `[]`

#### `packages/ai/src/__tests__/ai-chat-context-preview.test.tsx` (NEW)
≥4 cases. Wrap with a real `<AiChatProvider config={{ endpoint: '/api/chat', tourContext: true, ... }} tourContextValue={mockTourState}>`. Cases: (a) renders the summary text matching `/Tour context — \d+ chars, \d+ events/`; (b) clicking the summary toggles the `open` attribute on `<details>`; (c) returns `null` when `config.tourContext` is `false` (verify `container.firstChild === null`); (d) when `JSON.stringify(resolved).length > maxPromptChars`, the body shows a truncated `<pre>` + a "Show full prompt" button that on click reveals the full prompt.

#### `packages/ai/src/__tests__/ai-message-actions.test.tsx` (NEW)
≥5 cases:
1. **Copy:** spy `navigator.clipboard.writeText`; click Copy; assert called once with the joined text-part string and that a `Copied` aria-live span appears.
2. **Regenerate:** stub the context's `reload` method; click Regenerate; assert `reload` called once.
3. **Open-step happy path:** message text contains `"Try @step:welcome-cta now"`; mock `useTourActions` from `@tour-kit/core` to return a controllable object; click the action; assert `goToStep` called once with `'welcome-cta'`.
4. **Open-step hidden when no token:** message text contains zero `@step:` tokens; assert `queryByRole('button', { name: /open step/i }) === null`.
5. **Open-step hidden when tourId undefined:** even with a `@step:foo` token in the text, when `<AiMessageActions tourId={undefined}>`, assert the open-step button is not rendered.
Plus a bonus case: **Multiple tokens** — message contains `"@step:a then @step:b"`; assert the rendered label is `"Open step: a"` (FIRST match wins) and clicking calls `goToStep('a')`.

#### `packages/ai/src/__tests__/ai-chat-panel-route.test.tsx` (NEW)
≥2 cases. Mock `next/navigation` via `vi.mock('next/navigation', () => ({ usePathname: vi.fn() }))` and import `usePathname` to control its return value. Cases:
1. **Route change without remount:** mount `<AiChatPanel suggestions={{ '/dashboard': ['a'], '/help': ['b'], '*': ['c'] }} />`. Set `usePathname` to return `/dashboard`; assert suggestion `'a'` is rendered. Update the mock to return `/help` (use `vi.mocked(usePathname).mockReturnValue('/help')` then trigger a re-render via `rerender(...)`); assert `'b'` is rendered AND the root panel element's `data-instance-id` attribute (set via `useId` in the test wrapper) is identical pre and post — i.e., no remount.
2. **`'*'` fallback:** with the same suggestions map and `usePathname` returning `/settings`, assert `'c'` is rendered.

#### `apps/docs/content/docs/ai/context-preview.mdx` (NEW)
Three H2 sections per Task 10.4 description. Each section contains a runnable code block (TypeScript, fenced as `tsx`). Frontmatter: `title: AI panel polish`, `description: Show the resolved tour context, act on AI suggestions, and vary prompts by route.`.

#### `apps/docs/content/docs/ai/meta.json` (UPDATED)
Slot the new page after `getting-started` (or wherever the AI sidebar root sits — verify with `cat apps/docs/content/docs/ai/meta.json` before editing).

### Success Criteria
- `pnpm --filter @tour-kit/ai typecheck` exits 0
- `pnpm --filter @tour-kit/ai build` exits 0; bundle delta ≤3KB gzipped (`gzip -c packages/ai/dist/index.js | wc -c` minus baseline ≤3000)
- `pnpm --filter @tour-kit/ai test -- --run` exits 0 with all new test files passing and zero regressions
- `<AiChatContextPreview>` renders the summary with char count + event count when wrapped in `<AiChatProvider config={{ tourContext: true }} tourContextValue={mockTourState}>`
- `<AiMessageActions tourId="welcome">` calls `useTourActions("welcome").goToStep("welcome-cta")` when the message contains `@step:welcome-cta`
- Route-based suggestions swap on `usePathname()` change without remounting `<AiChatPanel>` (data-instance-id stable across route change)
- Deprecation warn for `showSuggestions` fires exactly once per page load in dev; zero warns in production
- `pnpm --filter docs build` exits 0 and the new MDX page renders in the AI sidebar

### Expected File Structure at End

```
tasks/v2-package-polish/
├── big-plan.md
├── phase-0.md
├── ...
├── phase-9.md
└── phase-10.md

packages/ai/src/
├── components/
│   ├── ai-chat-context-preview.tsx              # NEW
│   ├── ai-message-actions.tsx                   # NEW
│   ├── ai-chat-message.tsx                      # UPDATED — accepts actions slot
│   ├── ai-chat-message-list.tsx                 # UPDATED — accepts tourId prop
│   └── ai-chat-panel.tsx                        # UPDATED — suggestions + pathname props; showSuggestions deprecated
├── hooks/
│   └── use-current-pathname.ts                  # NEW
├── lib/
│   └── route-suggestions.ts                     # NEW
├── context/
│   ├── ai-chat-context.ts                       # UPDATED — getEvents optional method
│   └── ai-chat-provider.tsx                     # UPDATED — event ring buffer + getEvents()
├── __tests__/
│   ├── route-suggestions.test.ts                # NEW
│   ├── ai-chat-context-preview.test.tsx         # NEW
│   ├── ai-message-actions.test.tsx              # NEW
│   └── ai-chat-panel-route.test.tsx             # NEW
└── index.ts                                     # UPDATED — re-exports new symbols

packages/ai/package.json                         # UPDATED — version 2.0.0

apps/docs/content/docs/ai/
├── context-preview.mdx                          # NEW
└── meta.json                                    # UPDATED — sidebar entry
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 1 task 1.1 (`useTourActions(id)`) is cited and the verbatim signed-off signature (interface + function declaration) is pasted in the Execution Prompt under "Signed-off Signatures." `assembleTourContext` from `@tour-kit/ai/hooks/use-tour-assistant.ts` is named with import path; `AiChatEvent` type location is named (`packages/ai/src/types/events.ts`); existing `<AiChatSuggestions>` flat-array contract is documented as preserved.
- [PASS] Every sub-task has a clear, testable completion condition — each of 10.1–10.4 has a `Sanity check` one-liner combining typecheck + filtered test runs (`pnpm --filter @tour-kit/ai test -- --run <suite>`). The bundle delta has an explicit numeric ceiling (≤3KB gzipped) and a measurement command.
- [PASS] Execution prompt is self-contained — Phase 1's `useTourActions` signature is pasted verbatim (no "see Phase 1" reference); all three public interfaces (`AiChatContextPreviewProps`, `AiMessageActionsProps`, `MessageAction`) are inline; the longest-prefix-match selector code is pasted verbatim under "Confirmed Library APIs"; the `useCurrentPathname` lazy-require adapter is pasted verbatim; the step-id parser regex + `parseStepIds` helper is pasted verbatim; per-file guidance has one paragraph per file in the deliverables tree; success criteria are observable shell commands.
- [PASS] Exit criteria map 1:1 to deliverables — every NEW/UPDATED file in the deliverables tree appears in at least one exit checkbox (typecheck, test, build, or docs build). The bundle delta check, route-change-no-remount check, and `showSuggestions` deprecation warn check are each their own checkbox. The "open mentioned step" integration test is explicitly listed.
- [PASS] Heavy external deps have a fake/stub strategy noted — no heavy deps in Phase 10. `next/navigation` is mocked via `vi.mock('next/navigation', ...)` in the route test; `@tour-kit/core`'s `useTourActions` is mocked via `vi.mock('@tour-kit/core', ...)` in the message-actions test; `navigator.clipboard.writeText` is stubbed via `vi.spyOn(navigator.clipboard, 'writeText')`. All stubbing strategies are named inline in the per-file test guidance.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — no new libraries this phase. `usePathname()` is Next.js native and is loaded via lazy `require('next/navigation')` (snippet pasted verbatim); `navigator.clipboard.writeText` is web-platform native; `useTourActions` is in-repo from Phase 1 (signature pasted verbatim). Marked PASS by policy: "no new libraries → no Context7 calls required."
