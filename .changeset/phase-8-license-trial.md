---
'@tour-kit/license': minor
---

Phase 8 — Trial tier + dev clarity for `@tour-kit/license`.

- Add `<TrialBadge>` — client-derived trial countdown that flips to an Upgrade CTA when `daysLeft <= 3`. Reads from `useLicense().trial` when no `daysLeft` prop is passed.
- Add `<LicenseDebugPanel>` — dev-only license inspection panel. Renders the literal copy `🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set, hostname=localhost)` so the dev-bypass state is unambiguous. Returns `null` in production by default.
- Add `<LicenseTestMode tier="invalid" | "pro" | "free">` — QA-only context override so the watermark, adoption gate, and Pro fallbacks can be verified on a real production-like domain without unsetting env vars. Emits a loud `console.warn` in production and is enforced by a static guard script (`scripts/check-license-test-mode.mjs`) that fails the package test pipeline on application-source imports.
- Add pure helper `getDaysLeft({ issuedAt, trialDays, validatedAt, serverValidatedAt }, now?)` in `@tour-kit/license/headless`. Anchors to Polar's `last_validated_at` plus local elapsed time to absorb client clock skew.
- Extend `LicenseProviderProps` with optional `trialDays` and `trialIssuedAt`. Extend `LicenseState` with `serverValidatedAt?: number | null` (parsed from Polar `last_validated_at`). Extend `LicenseContextValue` with `trial: TrialContextValue | null`.
- Update `polar-client.ts` to map `response.lastValidatedAt` into `state.serverValidatedAt` on validated, expired, and revoked branches. `LicenseCacheSchema` now accepts the optional field; old v1.0.x cache entries continue to parse.
- The Polar Zod schema does NOT gain a `tier` field — the API doesn't emit one (memory project_polar_api_findings.md #187 / Phase 0 §6). Pinned with `schema-no-tier.regression.test.ts`.
- New docs page `apps/docs/content/docs/licensing/trial.mdx` covers the trial surface, debug panel, test mode, and the future schema-migration plan when Polar ships server-side trial signalling.
