---
"@tour-kit/adoption": major
---

Remove the unused `FeatureResources` interface and the `Feature.resources` field, plus their public re-exports from the package barrel and the `types` barrel. These were typed-but-dead — no runtime code ever read `resources`.

Removing a publicly exported type is a breaking change, so this is a major even though no working code depended on it. (Deprecating it in place was rejected: it would leave the dead symbol in the published `.d.ts`, which is exactly the trust problem this change removes.)
