/**
 * Type-test harness selftest.
 *
 * This file MUST contain a real type error guarded by `@ts-expect-error`.
 * Removing that line MUST cause `pnpm --filter @tour-kit/core typecheck:types`
 * to exit non-zero. If it doesn't, the harness is broken — fix it before
 * trusting any other `.test-d.ts` in this package.
 */

// @ts-expect-error intentional — proves the harness fails when types regress.
const _x: number = 'wrong'
void _x
