import { describe, expect, it, vi } from 'vitest'
import type { BranchContext, BranchTarget } from '../../types/branch'
import {
  MAX_BRANCH_DEPTH,
  isBranchResolver,
  isBranchSkip,
  isBranchToTour,
  isBranchWait,
  isLoopDetected,
  isSpecialTarget,
  resolveBranch,
  resolveTargetToIndex,
} from '../../utils/branch'

// Mock logger to suppress warnings in tests
vi.mock('../../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

function createMockBranchContext(overrides: Partial<BranchContext> = {}): BranchContext {
  return {
    tourId: 'test-tour',
    isActive: true,
    currentStepIndex: 0,
    currentStep: null,
    totalSteps: 3,
    isLoading: false,
    isTransitioning: false,
    completedTours: [],
    skippedTours: [],
    visitedSteps: [],
    stepVisitCount: new Map(),
    previousStepId: null,
    tour: null,
    data: {},
    setData: vi.fn(),
    ...overrides,
  }
}

describe('branch utilities', () => {
  describe('type guards', () => {
    describe('isBranchToTour', () => {
      it('returns true for valid BranchToTour objects', () => {
        expect(isBranchToTour({ tour: 'other-tour' })).toBe(true)
        expect(isBranchToTour({ tour: 'other-tour', step: 'intro' })).toBe(true)
        expect(isBranchToTour({ tour: 'other-tour', step: 0 })).toBe(true)
      })

      it('returns false for non-BranchToTour values', () => {
        expect(isBranchToTour(null)).toBe(false)
        expect(isBranchToTour('step-id')).toBe(false)
        expect(isBranchToTour(0)).toBe(false)
        expect(isBranchToTour({ skip: 2 })).toBe(false)
        expect(isBranchToTour({ wait: 1000 })).toBe(false)
        expect(isBranchToTour('next')).toBe(false)
      })
    })

    describe('isBranchSkip', () => {
      it('returns true for valid BranchSkip objects', () => {
        expect(isBranchSkip({ skip: 1 })).toBe(true)
        expect(isBranchSkip({ skip: 2 })).toBe(true)
        expect(isBranchSkip({ skip: -1 })).toBe(true)
      })

      it('returns false for non-BranchSkip values', () => {
        expect(isBranchSkip(null)).toBe(false)
        expect(isBranchSkip('step-id')).toBe(false)
        expect(isBranchSkip({ tour: 'other' })).toBe(false)
        expect(isBranchSkip({ wait: 1000 })).toBe(false)
      })
    })

    describe('isBranchWait', () => {
      it('returns true for valid BranchWait objects', () => {
        expect(isBranchWait({ wait: 1000 })).toBe(true)
        expect(isBranchWait({ wait: 500, then: 'next' })).toBe(true)
        expect(isBranchWait({ wait: 0 })).toBe(true)
      })

      it('returns false for non-BranchWait values', () => {
        expect(isBranchWait(null)).toBe(false)
        expect(isBranchWait('step-id')).toBe(false)
        expect(isBranchWait({ tour: 'other' })).toBe(false)
        expect(isBranchWait({ skip: 2 })).toBe(false)
      })
    })

    describe('isSpecialTarget', () => {
      it('returns true for special targets', () => {
        expect(isSpecialTarget('next')).toBe(true)
        expect(isSpecialTarget('prev')).toBe(true)
        expect(isSpecialTarget('complete')).toBe(true)
        expect(isSpecialTarget('skip')).toBe(true)
        expect(isSpecialTarget('restart')).toBe(true)
      })

      it('returns false for non-special targets', () => {
        expect(isSpecialTarget('step-id')).toBe(false)
        expect(isSpecialTarget(0)).toBe(false)
        expect(isSpecialTarget(null)).toBe(false)
        expect(isSpecialTarget({ tour: 'other' })).toBe(false)
      })
    })

    describe('isBranchResolver', () => {
      it('returns true for functions', () => {
        expect(isBranchResolver(() => 'next')).toBe(true)
        expect(isBranchResolver(async () => 'complete')).toBe(true)
        expect(isBranchResolver((ctx) => ctx.data.role as string)).toBe(true)
      })

      it('returns false for non-functions', () => {
        expect(isBranchResolver('next')).toBe(false)
        expect(isBranchResolver(0)).toBe(false)
        expect(isBranchResolver(null)).toBe(false)
        expect(isBranchResolver({ tour: 'other' })).toBe(false)
      })
    })
  })

  describe('resolveBranch', () => {
    it('returns static targets unchanged', async () => {
      const context = createMockBranchContext()

      expect(await resolveBranch('next', context)).toBe('next')
      expect(await resolveBranch('step-id', context)).toBe('step-id')
      expect(await resolveBranch(2, context)).toBe(2)
      expect(await resolveBranch(null, context)).toBe(null)
      expect(await resolveBranch({ tour: 'other' }, context)).toEqual({ tour: 'other' })
    })

    it('calls resolver functions with context', async () => {
      const context = createMockBranchContext({ data: { role: 'developer' } })
      const resolver = vi.fn().mockReturnValue('dev-path')

      const result = await resolveBranch(resolver, context)

      expect(resolver).toHaveBeenCalledWith(context)
      expect(result).toBe('dev-path')
    })

    it('handles async resolvers', async () => {
      const context = createMockBranchContext()
      const asyncResolver = vi.fn().mockResolvedValue('async-result')

      const result = await resolveBranch(asyncResolver, context)

      expect(result).toBe('async-result')
    })

    it('falls back to "next" on resolver error', async () => {
      const context = createMockBranchContext()
      const errorResolver = vi.fn().mockRejectedValue(new Error('Test error'))

      const result = await resolveBranch(errorResolver, context)

      expect(result).toBe('next')
    })

    it('falls back to "next" when max depth exceeded', async () => {
      const context = createMockBranchContext()

      // Pass depth > MAX_BRANCH_DEPTH
      const result = await resolveBranch('step-id', context, MAX_BRANCH_DEPTH + 1)

      expect(result).toBe('next')
    })

    it('resolvers can access and use context data', async () => {
      const context = createMockBranchContext({
        data: { userType: 'premium', completedOnboarding: false },
        visitedSteps: ['intro', 'features'],
      })

      const resolver = (ctx: BranchContext): BranchTarget => {
        if (ctx.data.userType === 'premium' && !ctx.data.completedOnboarding) {
          return 'premium-intro'
        }
        if (ctx.visitedSteps.includes('features')) {
          return 'advanced-features'
        }
        return 'next'
      }

      const result = await resolveBranch(resolver, context)
      expect(result).toBe('premium-intro')
    })
  })

  describe('resolveTargetToIndex', () => {
    const stepIdMap = new Map([
      ['intro', 0],
      ['features', 1],
      ['outro', 2],
    ])
    const totalSteps = 3

    it('returns current index for null target', () => {
      expect(resolveTargetToIndex(null, 1, stepIdMap, totalSteps)).toBe(1)
    })

    it('returns direct index for number targets', () => {
      expect(resolveTargetToIndex(0, 1, stepIdMap, totalSteps)).toBe(0)
      expect(resolveTargetToIndex(2, 0, stepIdMap, totalSteps)).toBe(2)
    })

    it('clamps number targets to valid range', () => {
      expect(resolveTargetToIndex(-1, 1, stepIdMap, totalSteps)).toBe(0)
      expect(resolveTargetToIndex(10, 1, stepIdMap, totalSteps)).toBe(2)
    })

    it('resolves step IDs to indices', () => {
      expect(resolveTargetToIndex('intro', 1, stepIdMap, totalSteps)).toBe(0)
      expect(resolveTargetToIndex('features', 0, stepIdMap, totalSteps)).toBe(1)
      expect(resolveTargetToIndex('outro', 0, stepIdMap, totalSteps)).toBe(2)
    })

    it('returns null for unknown step IDs', () => {
      expect(resolveTargetToIndex('unknown-step', 0, stepIdMap, totalSteps)).toBe(null)
    })

    it('handles "next" special target', () => {
      expect(resolveTargetToIndex('next', 0, stepIdMap, totalSteps)).toBe(1)
      expect(resolveTargetToIndex('next', 1, stepIdMap, totalSteps)).toBe(2)
      expect(resolveTargetToIndex('next', 2, stepIdMap, totalSteps)).toBe(null) // At last step
    })

    it('handles "prev" special target', () => {
      expect(resolveTargetToIndex('prev', 2, stepIdMap, totalSteps)).toBe(1)
      expect(resolveTargetToIndex('prev', 1, stepIdMap, totalSteps)).toBe(0)
      expect(resolveTargetToIndex('prev', 0, stepIdMap, totalSteps)).toBe(null) // At first step
    })

    it('returns null for "complete", "skip", "restart" targets', () => {
      expect(resolveTargetToIndex('complete', 1, stepIdMap, totalSteps)).toBe(null)
      expect(resolveTargetToIndex('skip', 1, stepIdMap, totalSteps)).toBe(null)
      expect(resolveTargetToIndex('restart', 1, stepIdMap, totalSteps)).toBe(null)
    })

    it('returns null for BranchToTour targets', () => {
      expect(resolveTargetToIndex({ tour: 'other' }, 1, stepIdMap, totalSteps)).toBe(null)
    })

    it('handles BranchSkip targets', () => {
      expect(resolveTargetToIndex({ skip: 1 }, 0, stepIdMap, totalSteps)).toBe(1)
      expect(resolveTargetToIndex({ skip: 2 }, 0, stepIdMap, totalSteps)).toBe(2)
      expect(resolveTargetToIndex({ skip: -1 }, 2, stepIdMap, totalSteps)).toBe(1)
    })

    it('clamps BranchSkip to valid range', () => {
      expect(resolveTargetToIndex({ skip: 10 }, 0, stepIdMap, totalSteps)).toBe(2)
      expect(resolveTargetToIndex({ skip: -10 }, 2, stepIdMap, totalSteps)).toBe(0)
    })

    it('returns null for BranchWait targets', () => {
      expect(resolveTargetToIndex({ wait: 1000 }, 1, stepIdMap, totalSteps)).toBe(null)
    })
  })

  describe('isLoopDetected', () => {
    it('returns false when step not visited', () => {
      const visitCount = new Map<string, number>()
      expect(isLoopDetected('step-1', visitCount)).toBe(false)
    })

    it('returns false when visits below threshold', () => {
      const visitCount = new Map([['step-1', 5]])
      expect(isLoopDetected('step-1', visitCount)).toBe(false)
    })

    it('returns true when visits at threshold', () => {
      const visitCount = new Map([['step-1', 10]])
      expect(isLoopDetected('step-1', visitCount)).toBe(true)
    })

    it('returns true when visits exceed threshold', () => {
      const visitCount = new Map([['step-1', 15]])
      expect(isLoopDetected('step-1', visitCount)).toBe(true)
    })

    it('respects custom maxVisits parameter', () => {
      const visitCount = new Map([['step-1', 3]])
      expect(isLoopDetected('step-1', visitCount, 3)).toBe(true)
      expect(isLoopDetected('step-1', visitCount, 5)).toBe(false)
    })
  })

  describe('MAX_BRANCH_DEPTH constant', () => {
    it('is set to 50', () => {
      expect(MAX_BRANCH_DEPTH).toBe(50)
    })
  })
})
