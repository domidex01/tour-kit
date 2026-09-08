/**
 * The options factory `createTourKit` takes, wrapped so it records how many
 * engines were built.
 *
 * Construction COUNT and construction MOMENT are the only observable that
 * separates "correct" from "works but boots during setup" — both produce a
 * working tour. Every lifecycle case here reads `factory.mock.calls.length`.
 *
 * Copied from core's `lib/tour-engine/__tests__/_helpers/`, not imported: core
 * does not export its test helpers. The copy is also a small proof of §1.5's
 * thesis — every symbol it needs is on `/engine`.
 *
 * One deliberate difference from core's copy: this returns the OPTIONS, not the
 * engine, because `createTourKit` takes `() => CreateTourEngineOptions` and does
 * the `createTourEngine` call itself. The observable is identical — the handle
 * invokes this exactly once per engine, at `ensure()` time — and keeping the
 * `createTourEngine` call inside the binding is what lets the binding own the
 * lazy construction the whole slice is about.
 *
 * Storage is a fresh `createMemoryStorage()` per engine: persistence defaults
 * ON since §1.4a and jsdom's `localStorage` is shared across a file.
 */
import { type CreateTourEngineOptions, createMemoryStorage } from '@tour-kit/core/engine'
import { vi } from 'vitest'

export function countingFactory(overrides: Partial<CreateTourEngineOptions> = {}) {
  return vi.fn(
    (): CreateTourEngineOptions => ({ tours: [], storage: createMemoryStorage(), ...overrides })
  )
}
