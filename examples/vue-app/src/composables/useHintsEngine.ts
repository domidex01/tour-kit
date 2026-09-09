import {
  type HintEngineConfig,
  type HintsEngineState,
  type HintsHandle,
  createHintsEngine,
  createHintsHandle,
} from '@tour-kit/hints/engine'
import {
  type InjectionKey,
  type ShallowRef,
  inject,
  onMounted,
  onScopeDispose,
  provide,
  shallowRef,
} from 'vue'

export interface HintsKit {
  handle: HintsHandle
  state: ShallowRef<HintsEngineState>
}

export const HINTS_KEY: InjectionKey<HintsKit> = Symbol('hints')

/**
 * The React binding's shape in Vue's lifecycle vocabulary.
 *
 * The factory SEEDS the engine — `setHints` and `boot()` — because a child's
 * `onMounted` runs before the parent's, exactly as a child effect does in
 * React. A dot that showed itself on mount would otherwise find no configs and
 * no storage, and a persisted dismissal would not suppress it.
 *
 * Nothing constructs in `setup()`: `handle.getState()` returns the frozen
 * `INITIAL_HINTS_STATE` until the first verb, and `handle.boot()` is `ensure()`
 * in disguise, so it waits for the client's `onMounted`. That is what makes
 * this SSR-safe without a `typeof window` check anywhere in the file.
 */
export function provideHintsEngine(hints: HintEngineConfig[]): HintsKit {
  const handle = createHintsHandle(() => {
    const engine = createHintsEngine()
    engine.setHints(hints)
    engine.boot()
    return engine
  })

  const state = shallowRef<HintsEngineState>(handle.getState())
  const off = handle.subscribe(() => {
    state.value = handle.getState()
  })

  onMounted(() => handle.boot())
  onScopeDispose(() => {
    off()
    handle.release()
  })

  const kit: HintsKit = { handle, state }
  provide(HINTS_KEY, kit)
  return kit
}

export function useHintsKit(): HintsKit {
  const kit = inject(HINTS_KEY)
  if (!kit) throw new Error('useHintsKit must be used under provideHintsEngine()')
  return kit
}
