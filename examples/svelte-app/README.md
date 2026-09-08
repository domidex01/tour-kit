# svelte-tour-kit-demo

What it proves: a SvelteKit app runs a two-page tour — start, keyboard, cross-route
navigation, advance-on, reload-resume, focus restore — with **no React
installed**. Everything comes from `@tour-kit/svelte`, which imports only
`@tour-kit/core/engine`. The card and its positioning live here, not in the
package.

```bash
pnpm --filter svelte-tour-kit-demo dev   # http://localhost:5176
```

`data-testid` map used by `e2e/svelte/tour-flow.localhost.spec.ts`:

| testid | what |
|---|---|
| `start-tour` | starts the tour (also `#start-tour`) |
| `start-here` | step 1's target (`#start-here`) |
| `theme-toggle` | step 2's target (`#theme-toggle`), document-bound step |
| `save-button` | step 3's target (`#save-button`) |
| `tour-card` | the card itself |
| `tour-card-title` / `tour-card-content` | step text |
| `tour-back` / `tour-next` / `tour-skip` | the card's button row |
