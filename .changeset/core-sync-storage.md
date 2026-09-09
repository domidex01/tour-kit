---
"@tour-kit/core": minor
---

`SyncStorage`, the synchronous storage-adapter shape, and `createPrefixedStorage` now preserves it.

Core's `Storage` permits `Promise`-returning methods so async adapters are possible, but several code paths read `getItem` inline and cannot use those. Each had re-declared the synchronous three-method shape locally. `SyncStorage` is now the one declaration, exported from the root, `/engine` and `utils`.

`createPrefixedStorage` is overloaded: hand it a synchronous adapter and you get a synchronous adapter back. It is a pure pass-through, so the wide return type was never accurate — it just forced every synchronous consumer to re-narrow with an `as` cast. `createNoopStorage()` is likewise typed `SyncStorage`, since every method on it is synchronous; narrowing a return type is safe for existing callers.
