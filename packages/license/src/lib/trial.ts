/**
 * Consumer-supplied trial configuration. Passed to <LicenseProvider trialDays={14} />
 * along with the implicit `issuedAt` derived from the license's first validation
 * (or a future server-side field when Polar ships one).
 *
 * Polar's /v1/customer-portal/license-keys/validate endpoint does NOT emit a
 * `tier` field today (confirmed Phase 0 task 0.6, memory project_polar_api_findings.md
 * entry #187). Trial state is therefore CLIENT-DERIVED. If Polar adds server-side
 * trial signalling later, getDaysLeft will accept an optional server-provided
 * override (marked `FUTURE:` below) — additive, non-breaking.
 */
export interface TrialConfig {
  /** Unix ms timestamp of when the trial started. Sourced from license issuance time. */
  issuedAt: number
  /** Length of the trial window in whole days. E.g. 14. */
  trialDays: number
  /** Local Date.now() timestamp captured when validation ran. */
  validatedAt: number
  /** Polar last_validated_at parsed to Unix ms. Null when unavailable. */
  serverValidatedAt?: number | null
}

/**
 * Compute days remaining in the trial window. Uses Polar's server validation
 * timestamp plus local elapsed time when available, and falls back to `now`
 * when no server anchor exists. Clamps to [0, trialDays].
 *
 * The serverValidatedAt + (now - validatedAt) algebra absorbs client clock
 * skew: Polar gives the server anchor at validation time; the local clock only
 * contributes the (now - validatedAt) delta, which on a normal machine is the
 * real elapsed time and on a skewed machine is the same delta (skew cancels).
 *
 * @param config The trial config from <LicenseProvider>.
 * @param now Override for testing. Defaults to Date.now().
 * @returns Integer days remaining in [0, trialDays].
 */
export function getDaysLeft(config: TrialConfig, now: number = Date.now()): number {
  const trustedNow =
    config.serverValidatedAt && config.serverValidatedAt > 0
      ? config.serverValidatedAt + Math.max(0, now - config.validatedAt)
      : now
  const elapsedMs = Math.max(0, trustedNow - config.issuedAt)
  const elapsedDays = Math.floor(elapsedMs / 86_400_000)
  const remaining = config.trialDays - elapsedDays
  // FUTURE: if Polar adds `tier='trial'` to the validate response, accept an
  // optional serverDaysLeft override here and return it when defined.
  return Math.max(0, Math.min(config.trialDays, remaining))
}
