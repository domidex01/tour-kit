import { type Mock, vi } from 'vitest'
import type { RouterAdapter } from '../../../../types/router'
import type { Tour } from '../../../../types/tour'
import type { TourReducerState } from '../../../../types/tour-reducer'
import type { TourEngineAnalytics, TourEngineContext } from '../../context'

export interface FakeEngineOverrides {
  state?: Partial<TourReducerState>
  currentTour?: Tour | null
  data?: Record<string, unknown>
  stepIdMap?: Map<string, number>
  router?: Partial<RouterAdapter>
  autoNavigate?: boolean
  maxHiddenChain?: number
  tourKitContext?: TourEngineAnalytics | null
  persistTerminalTours?: boolean
  routePersistenceEnabled?: boolean
  flowSessionEnabled?: boolean
  tabId?: string
  onTourPaused?: TourEngineContext['onTourPaused']
  onNavigationRequired?: TourEngineContext['onNavigationRequired']
  onStepError?: TourEngineContext['onStepError']
  abortSignal?: AbortSignal | null
  preAborted?: boolean
  navigateToStep?: (stepIndex: number) => Promise<boolean>
}

export interface FakeRouterMock {
  navigate: Mock<RouterAdapter['navigate']>
  getCurrentRoute: Mock<RouterAdapter['getCurrentRoute']>
  matchRoute: Mock<RouterAdapter['matchRoute']>
  onRouteChange: Mock<NonNullable<RouterAdapter['onRouteChange']>>
}

export interface FakeEngineHandle {
  ctx: TourEngineContext
  mocks: {
    dispatch: ReturnType<typeof vi.fn>
    completeTour: ReturnType<typeof vi.fn>
    skipTour: ReturnType<typeof vi.fn>
    setData: ReturnType<typeof vi.fn>
    navigateToStep: ReturnType<typeof vi.fn>
    markCompleted: ReturnType<typeof vi.fn>
    markSkipped: ReturnType<typeof vi.fn>
    resetPersistence: ReturnType<typeof vi.fn>
    clearRouteState: ReturnType<typeof vi.fn>
    saveRouteState: ReturnType<typeof vi.fn>
    saveFlowSession: ReturnType<typeof vi.fn>
    clearFlowSession: ReturnType<typeof vi.fn>
    announce: ReturnType<typeof vi.fn>
    onTourPaused: ReturnType<typeof vi.fn>
    router: FakeRouterMock
    onNavigationRequired: ReturnType<typeof vi.fn>
    onStepError: ReturnType<typeof vi.fn>
  }
  setState: (next: Partial<TourReducerState>) => void
  setCurrentTour: (tour: Tour | null) => void
  abortController: AbortController
}

const baseState: TourReducerState = {
  tourId: 't1',
  isActive: true,
  currentStepIndex: 0,
  currentStep: null,
  totalSteps: 0,
  isLoading: false,
  isTransitioning: false,
  completedTours: [],
  skippedTours: [],
  visitedSteps: [],
  stepVisitCount: new Map<string, number>(),
  previousStepId: null,
  tours: new Map<string, Tour>(),
}

function buildFakeRouter(overrides?: Partial<RouterAdapter>): FakeRouterMock {
  return {
    navigate: vi.fn(overrides?.navigate ?? (() => Promise.resolve(undefined))) as Mock<
      RouterAdapter['navigate']
    >,
    getCurrentRoute: vi.fn(overrides?.getCurrentRoute ?? (() => '/')) as Mock<
      RouterAdapter['getCurrentRoute']
    >,
    matchRoute: vi.fn(overrides?.matchRoute ?? (() => false)) as Mock<RouterAdapter['matchRoute']>,
    onRouteChange: vi.fn(overrides?.onRouteChange ?? (() => () => {})) as Mock<
      NonNullable<RouterAdapter['onRouteChange']>
    >,
  }
}

export function createFakeEngineContext(overrides: FakeEngineOverrides = {}): FakeEngineHandle {
  let state: TourReducerState = { ...baseState, ...overrides.state }
  let currentTour = overrides.currentTour ?? null
  let data = overrides.data ?? {}
  let stepIdMap = overrides.stepIdMap ?? new Map<string, number>()

  // Keep tour map in sync with currentTour for cross-tour reads. The engine
  // reads `state.tours` for BranchToTour resolution.
  if (currentTour && !state.tours.has(currentTour.id)) {
    state = { ...state, tours: new Map(state.tours).set(currentTour.id, currentTour) }
  }

  const dispatch = vi.fn()
  const completeTour = vi.fn()
  const skipTour = vi.fn()
  const setData = vi.fn((k: string, v: unknown) => {
    data = { ...data, [k]: v }
  })

  const router = buildFakeRouter(overrides.router)

  const onNavigationRequired = vi.fn(overrides.onNavigationRequired ?? (() => {}))
  const onStepError = vi.fn(overrides.onStepError ?? (() => {}))

  const abortController = new AbortController()
  if (overrides.preAborted) abortController.abort()
  const abortControllerRef = { current: abortController }

  const completedTourIdRef = { current: null as string | null }
  const skippedTourIdRef = { current: null as string | null }

  const navigateToStep = vi.fn(
    overrides.navigateToStep ?? ((_idx: number) => Promise.resolve(true))
  )

  // v2 §1.3d — the terminal-store / route-store seams. Spies, not stores: the
  // adapters have their own suites; what actions.ts owes is calling them at
  // the right moment with the right id.
  const markCompleted = vi.fn()
  const markSkipped = vi.fn()
  const resetPersistence = vi.fn()
  const clearRouteState = vi.fn()

  // v2 §1.3e — the transition sinks.
  const saveRouteState = vi.fn()
  const saveFlowSession = vi.fn()
  const clearFlowSession = vi.fn()
  const announce = vi.fn()
  const onTourPaused = vi.fn(overrides.onTourPaused ?? (() => {}))

  const ctx: TourEngineContext = {
    getState: () => state,
    getCurrentTour: () => currentTour,
    getData: () => data,
    getStepIdMap: () => stepIdMap,
    dispatch,
    abortControllerRef,
    completedTourIdRef,
    skippedTourIdRef,
    router: router satisfies RouterAdapter,
    autoNavigate: overrides.autoNavigate ?? true,
    maxHiddenChain: overrides.maxHiddenChain ?? 50,
    onNavigationRequired,
    onStepError,
    completeTour,
    skipTour,
    setData,
    navigateToStep,
    persistTerminalTours: overrides.persistTerminalTours ?? false,
    markCompleted,
    markSkipped,
    resetPersistence,
    clearRouteState,
    saveRouteState,
    saveFlowSession,
    clearFlowSession,
    routePersistenceEnabled: overrides.routePersistenceEnabled ?? false,
    flowSessionEnabled: overrides.flowSessionEnabled ?? false,
    tabId: overrides.tabId ?? 'tab-fake',
    announce,
    crossTab: { lastAnnounceTs: null },
    onTourPaused,
    tourKitContext: overrides.tourKitContext ?? null,
  }

  return {
    ctx,
    mocks: {
      dispatch,
      completeTour,
      skipTour,
      setData,
      navigateToStep,
      markCompleted,
      markSkipped,
      resetPersistence,
      clearRouteState,
      saveRouteState,
      saveFlowSession,
      clearFlowSession,
      announce,
      onTourPaused,
      router,
      onNavigationRequired,
      onStepError,
    },
    setState(next) {
      state = { ...state, ...next }
    },
    setCurrentTour(tour) {
      currentTour = tour
      if (tour) {
        state = { ...state, tours: new Map(state.tours).set(tour.id, tour) }
      }
      stepIdMap = new Map()
      tour?.steps.forEach((s, i) => stepIdMap.set(s.id, i))
    },
    abortController,
  }
}
