# @tour-kit/codemods

## 0.4.0

### Minor Changes

- 31b2f7b: Narrow the public API surface to CLI-only.

  The previous JS-API re-exports (`fromJoyride`, `fromJoyrideParser`, `mapStepObject`,
  `emitTodo`, `todoToComment`, `runMigrate`) and their accompanying types
  (`StepMapping`, `Todo`, `CliOptions`) were intended as internal helpers but
  ended up in `packages/codemods/src/index.ts`. The package ships with a `bin`
  (`tour-kit-migrate`) and is consumed exclusively via `npx tour-kit-migrate`,
  so the JS API was undocumented and unused outside the package itself.

  **Breaking:** `import { ... } from '@tour-kit/codemods'` now returns nothing.
  If you were depending on the programmatic API, please open an issue describing
  your use case — we'd rather build a small, documented surface than leave the
  current accidental exports in place.

  The CLI behavior is unchanged.

## 0.3.0

### Minor Changes

- 8c4ef89: target-as-ref + MultiTourKit compose-mode (Phase 5 of v2 package polish).

  The `target` prop on `TourStep` and `HintConfig` now accepts a third shape —
  a getter function `() => HTMLElement | null` — alongside the existing string
  selector and `RefObject<HTMLElement | null>`. All runtime dereference paths
  (use-step, use-element-position, wait-for-step-target, utils/dom, plus four
  React card/overlay consumers and both hints components) route through a
  single new `resolveTarget` resolver exported from `@tour-kit/core`. The
  union widening is fully backwards-compatible — existing string selectors
  keep working with no console warning, and the resolver is SSR-safe (returns
  null when `document` is undefined instead of throwing).

  `<MultiTourKitProvider>` compose-mode is now the documented default: the
  JSDoc example puts every `<Tour>`, `<TourOverlay>`, `<TourCard>`, and `<App />`
  as children of the provider, and `useTour()` resolves through the registry
  from any depth. The provider's runtime behavior is unchanged.

  A new best-effort jscodeshift codemod `--from target-to-ref` rewrites
  `target="#foo"` to `target={fooRef}` when a matching `useRef` binding lives
  in the same file. Ambiguous matches get a `TODO(tour-kit): target-to-ref`
  comment instead of a destructive rewrite, and the transform is idempotent
  under re-runs.

  Docs page: `/docs/react/target-prop`.

## 0.2.1

### Patch Changes

- 6e77a3b: Point each package's `homepage` field at https://usertourkit.com/ so the "Homepage" link in the npm sidebar opens the docs site instead of the GitHub README.

## 0.2.0

### Minor Changes

- 3fe2d82: feat(codemods): shepherd.js + driver.js transforms

  Adds `--from shepherd` and `--from driver` to `tour-kit-migrate`. The
  Joyride transform from Phase 7a is unchanged.

  - **Shepherd.js** reconstitutes the class-chain imperative API
    (`new Shepherd.Tour({...})` + chained `.addStep({...})` + `.start()`)
    into a single `{ id, steps: [...] }` Tour Kit tour literal. Step
    shapes (`attachTo.element` / `attachTo.on` / `text` / `id`) map to
    Tour Kit's `target` / `placement` / `content` / `id`. Control-flow
    calls (`start`, `cancel`, `show`, `hide`, `complete`, `next`, `back`)
    become empty statements with TODO comments pointing at the
    `useTour()` equivalent.
  - **Driver.js** reshapes the `driver({...})` function-style config into
    the same Tour Kit tour literal. Step shapes map `element` → `target`
    and `popover.{title, description, side}` → `{title, content, placement}`.
    `.drive()` becomes an empty statement with a TODO pointing at
    `useTour().start()`.

  Both transforms emit `// TODO: ... https://tourkit.dev/migration/{source}#{anchor}`
  comments for any unsupported pattern; the corresponding `shepherd.mdx` and
  `driver.mdx` pages document the manual-port path for every anchor.

  Coverage on the committed fixture corpora: Joyride 100%, Shepherd 100%,
  Driver 100%. The `EXPERIMENTAL_TRANSFORMS` set in `src/cli.ts` is empty —
  both new transforms ship stable.
