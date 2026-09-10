/**
 * v3 Phase 3 — the generic parameter, pinned (plan Decision 4, §0 C6a).
 *
 * `expectTypeOf` is a REAL gate in this package: `tsconfig.json` has
 * `include: ["src/**\/*"]` and no `exclude`, so all 41+ test files are in the
 * `tsc` program and `pnpm --filter @tour-kit/announcements typecheck` enforces
 * every line below. (Surveys excludes its tests, so the same file there would
 * prove nothing — PR B uses a file scan instead.)
 *
 * What is being pinned: the ONE generic parameter is what lets the React side
 * hold `ReactNode`-carrying configs in `state.configs` while the engine's own
 * types never mention React. If someone widens the engine's `configs` to
 * `AnnouncementConfig`, or drops the parameter, these fail at build time.
 */
import type { ReactNode } from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import type { AnnouncementConfig, AnnouncementState } from '../../../types/announcement'
import { createAnnouncementsEngine } from '../create-announcements-engine'
import type { AnnouncementsEngineState, EngineAnnouncementConfig } from '../types'

interface RichConfig extends EngineAnnouncementConfig {
  title?: ReactNode
}

describe('AnnouncementsEngineState carries its config type', () => {
  it('defaults to the engine config', () => {
    expectTypeOf<AnnouncementsEngineState['configs']>().toEqualTypeOf<
      Map<string, EngineAnnouncementConfig>
    >()
  })

  it('carries a widened config through the parameter', () => {
    expectTypeOf<AnnouncementsEngineState<RichConfig>['configs']>().toEqualTypeOf<
      Map<string, RichConfig>
    >()
  })

  it('leaves the announcements map React-free at every instantiation', () => {
    expectTypeOf<AnnouncementsEngineState<RichConfig>['announcements']>().toEqualTypeOf<
      Map<string, AnnouncementState>
    >()
  })
})

describe('the React config extends the engine config', () => {
  it('is assignable to it, so a React config can drive the engine', () => {
    expectTypeOf<AnnouncementConfig>().toExtend<EngineAnnouncementConfig>()
  })

  it('narrows `variant` from optional to required', () => {
    expectTypeOf<AnnouncementConfig['variant']>().not.toEqualTypeOf<
      EngineAnnouncementConfig['variant']
    >()
    expectTypeOf<EngineAnnouncementConfig['variant']>().toEqualTypeOf<
      AnnouncementConfig['variant'] | undefined
    >()
  })

  it('adds ReactNode fields the engine config does not have', () => {
    expectTypeOf<AnnouncementConfig>().toHaveProperty('title')
    // @ts-expect-error — the engine config must NOT know about `title`
    expectTypeOf<EngineAnnouncementConfig>().toHaveProperty('title')
  })
})

describe('the factory infers its state from the config it is given', () => {
  it('returns a state parameterised by the config passed in', () => {
    const engine = createAnnouncementsEngine<RichConfig>({ announcements: [] })
    expectTypeOf(engine.getState()).toEqualTypeOf<AnnouncementsEngineState<RichConfig>>()
    expectTypeOf(engine.getConfig('a')).toEqualTypeOf<RichConfig | undefined>()
  })

  it('accepts the React config, which is the whole job of the binding', () => {
    const engine = createAnnouncementsEngine<AnnouncementConfig>({ announcements: [] })
    expectTypeOf(engine.getConfig('a')).toEqualTypeOf<AnnouncementConfig | undefined>()
  })
})
