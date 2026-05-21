// Module-scope `warnedUnknownSegments` (in `core/lib/audience.ts`) leaks
// across tests. Using a fresh name per test avoids cross-test coupling —
// the warn-once dedupe never matches a previous test's seed.
let counter = 0

export function uniqueSegment(prefix: string): string {
  counter += 1
  return `${prefix}-${counter}-${Math.random().toString(36).slice(2, 8)}`
}
