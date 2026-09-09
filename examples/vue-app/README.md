# vue-tour-kit-demo

What it proves: a Vue 3 app runs a two-page tour — start, keyboard, cross-route
navigation, advance-on, reload-resume, focus restore — with **no React
installed**. Everything comes from `@tour-kit/vue`, which imports only
`@tour-kit/core/engine`. The card and its positioning live here, not in the
package.

```bash
pnpm --filter vue-tour-kit-demo dev   # http://localhost:5175
```

`data-testid` map used by `e2e/vue/tour-flow.localhost.spec.ts`:

| testid | what |
|---|---|
| `start-tour` | starts the tour (also `#start-tour`) |
| `start-here` | step 1's target (`#start-here`) |
| `theme-toggle` | step 2's target (`#theme-toggle`), document-bound step |
| `save-button` | step 3's target (`#save-button`) |
| `tour-card` | the card itself |
| `tour-card-title` / `tour-card-content` | step text |
| `tour-back` / `tour-next` / `tour-skip` | the card's button row |

## The hint (v3 Phase 1)

The dot beside **Export** on the Home route is a hint driven by
`@tour-kit/hints/engine` — the state machine, its frequency persistence and
`getHotspotPosition`, with no React. `src/composables/useHintsEngine.ts` wraps
`createHintsHandle` and bridges it to a `shallowRef`;
`src/components/HintDot.vue` renders the dot and the tooltip itself. No
`@tour-kit/hints` component is imported anywhere, and this app installs no
React.

Two things this example exists to pin, both of which cost a debugging session:

- **The factory seeds the engine.** `provideHintsEngine` calls `setHints` and
  `boot()` *inside* the factory handed to `createHintsHandle`, because a child's
  `onMounted` runs before the parent's — the same rule React's binding follows.
  Without the seed the first verb runs against an engine with no configs and no
  storage, and a persisted dismissal does not suppress the dot.
- **`HintDot` starts tracking from `onMounted` AND a watch.** `<App>` mounts and
  boots before vue-router resolves the initial route, so by the time `HintDot`
  sets up the hint is usually already registered. An `{ immediate: true }` watch
  therefore fires once, during setup, when `#hint-target` is not in the document
  yet — and never again, because its source never changes. Silent no-dot.

`react` and `react-dom` are optional peers of `@tour-kit/hints`, so no package
manager auto-installs them here. React *does* appear in `node_modules`, because
`@tour-kit/hints` hard-depends on `@tour-kit/media` which requires it — but not
in this app's bundle, and `vue-tsc` typechecks against a React-free `.d.ts`.

| testid | what |
|---|---|
| `hint-target` | the hint's anchor (`#hint-target`, the Export button) |
| `hint-dot-export` | the dot, positioned by `getHotspotPosition('top-right', rect)` |
| `hint-tooltip-export` | the popup, open only while `state.hints.get('export').isOpen` |
| `hint-dismiss-export` | dismisses; `frequency: 'once'` makes it stick across reloads |
