/**
 * v2 §1.4b — a `createTourEngine` factory that records how many engines it built.
 *
 * §1.4's whole risk surface is "how many, and when": zero during render, one
 * per mount, two across a StrictMode remount. Neither "built during render"
 * nor "built twice" is observable through tour state — both produce a working
 * tour — so every handle case reads `factory.mock.calls.length` rather than
 * reaching into the handle.
 *
 * Storage is a fresh `createMemoryStorage()` per engine so the persistence
 * default (ON since §1.4a) cannot leak into jsdom's file-shared
 * `localStorage`, and so engine 2 does not read what engine 1 wrote.
 */
import { vi } from 'vitest'
import { createMemoryStorage } from '../../../../utils/storage'
import { type CreateTourEngineOptions, createTourEngine } from '../../create-tour-engine'

export function countingFactory(overrides: Partial<CreateTourEngineOptions> = {}) {
  return vi.fn(() => createTourEngine({ tours: [], storage: createMemoryStorage(), ...overrides }))
}
