---
'@tour-kit/core': minor
---

`@tour-kit/core/engine` ships as a CDN build.

`dist/engine/index.global.js` is the engine subpath as one self-contained
script that defines `window.TourKit` with everything that subpath exports —
`createTourEngine`, the DOM behaviours, the storage adapters, the predicates.
The new `unpkg` and `jsdelivr` fields point at it, so
`https://unpkg.com/@tour-kit/core` serves it with no path:

```html
<script src="https://unpkg.com/@tour-kit/core@2/dist/engine/index.global.js"></script>
<script>
  TourKit.createTourEngine({ tours: [/* … */] }).start('welcome')
</script>
```

It is the engine only and renders nothing; the card is yours. `@tour-kit/react`
has no CDN build. No API change, and `exports` is untouched.
