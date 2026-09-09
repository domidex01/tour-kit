import type { ReactNode } from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import type {
  ChecklistConfig,
  ChecklistState,
  ChecklistTaskConfig,
  ChecklistTaskState,
} from '../../../types'
import type {
  ChecklistContextData,
  EngineChecklistConfig,
  EngineChecklistState,
  EngineTaskConfig,
} from '../types'

/**
 * The generic-config parameter is what makes `checklists` harder to extract
 * than `hints` (Decision 2): the engine's state has to carry a config type it
 * cannot name, because `ChecklistConfig` transitively reaches `ReactNode` and
 * `MediaSlotProps`. These assertions are the contract that narrowing still
 * works in both directions.
 *
 * This package typechecks its test files, so `pnpm typecheck` is a real gate
 * here — unlike core, whose `*.test-d.ts` files run in no vitest, turbo or CI
 * path. No `as` cast appears in this file by design.
 */
describe('the React types still narrow through the engine generics', () => {
  it('the React task config keeps its renderer-only fields', () => {
    expectTypeOf<ChecklistTaskConfig['icon']>().toEqualTypeOf<string | ReactNode | undefined>()
    expectTypeOf<'icon'>().toExtend<keyof ChecklistTaskConfig>()
    expectTypeOf<'media'>().toExtend<keyof ChecklistTaskConfig>()
  })

  it('the engine task config has neither — that is what keeps React out of /engine', () => {
    expectTypeOf<'icon'>().not.toExtend<keyof EngineTaskConfig>()
    expectTypeOf<'media'>().not.toExtend<keyof EngineTaskConfig>()
  })

  it('a React config is usable wherever an engine config is required', () => {
    expectTypeOf<ChecklistConfig>().toExtend<EngineChecklistConfig>()
    expectTypeOf<ChecklistTaskConfig>().toExtend<EngineTaskConfig>()
  })

  it('ChecklistState is the engine state instantiated at the React config', () => {
    expectTypeOf<ChecklistState>().toEqualTypeOf<EngineChecklistState<ChecklistConfig>>()
    // and the task states inside it still carry the React task config, so a
    // renderer can read `icon` off a state object without a cast
    expectTypeOf<ChecklistState['tasks'][number]['config']['icon']>().toEqualTypeOf<
      string | ReactNode | undefined
    >()
    expectTypeOf<ChecklistTaskState['config']>().toEqualTypeOf<ChecklistTaskConfig>()
  })

  it('the engine context is the public ChecklistContext under its old name', () => {
    expectTypeOf<ChecklistContextData['completedTours']>().toEqualTypeOf<string[]>()
    expectTypeOf<EngineTaskConfig['when']>().toEqualTypeOf<
      ((context: ChecklistContextData) => boolean) | undefined
    >()
  })
})
