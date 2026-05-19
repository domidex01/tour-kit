---
'@tour-kit/license': patch
---

Fix Pro-package SSR blackout in `<LicenseGate>` loading state.

`LicenseProvider` validates the license inside a `useEffect`, which never fires during server rendering. That left `context.isLoading` `true` on every SSR pass, and `<LicenseGate>` (used internally by all 8 Pro packages since 1.1.0) returned `null` whenever no explicit `loading` prop was passed — wiping the entire Pro subtree from server HTML and forcing a pop-in on hydration. The release smoke app caught this as a missing `data-smoke-ok` marker on the curl probe.

The loading branch now defaults to `children` instead of `null`. Consumers who want a skeleton during validation can still pass `loading={<Skeleton />}`; the watermark only renders once the gate decision is known.
