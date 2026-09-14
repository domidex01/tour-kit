---
'@tour-kit/core': major
'@tour-kit/react': major
'@tour-kit/hints': major
---

Relicense `core`, `react` and `hints` from MIT to the Business Source License
1.1, bringing the published packages in line with what usertourkit.com has been
telling people since the pricing change.

Production use now requires a userTourKit licence key. Development, evaluation,
testing, CI and any non-production environment stay free and need no key — that
is the Additional Use Grant, written into each package's `LICENSE.md`.

Each published version converts to MIT on its Change Date, four years after that
version ships. BSL 1.1's own terms cap it there ("or the fourth anniversary of
the first publicly available distribution of a specific version, whichever comes
first"), so a version's conversion date cannot drift even if the stamped date in
a later release is not bumped.

Nothing is retroactive. Every version published up to and including 2.1.0 was
released under MIT, and an MIT grant cannot be withdrawn — those versions stay
MIT forever, and anyone already depending on them is unaffected until they
choose to upgrade.
