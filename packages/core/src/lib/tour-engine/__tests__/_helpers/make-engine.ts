/**
 * v2 §1.3f — one call to get a fully injected engine.
 *
 * Storage is always a `createMemoryStorage()` so no unit test can leak into
 * jsdom's real `localStorage` (or read what a previous file left there).
 */
import { createMemoryStorage } from '../../../../utils/storage'
import { type CreateTourEngineOptions, createTourEngine } from '../../create-tour-engine'

export function makeEngine(overrides: Partial<CreateTourEngineOptions> = {}) {
  const storage = createMemoryStorage()
  const engine = createTourEngine({ tours: [], storage, ...overrides })
  return { engine, storage }
}
