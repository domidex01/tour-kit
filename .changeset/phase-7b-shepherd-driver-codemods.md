---
'@tour-kit/codemods': minor
---

feat(codemods): shepherd.js + driver.js transforms

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
