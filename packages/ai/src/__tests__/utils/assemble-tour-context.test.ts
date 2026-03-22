import { describe, expect, it } from 'vitest'
import { assembleTourContext } from '../../hooks/use-tour-assistant'
import { createActiveTourState, createInactiveTourState } from '../helpers/mock-tour-context'

describe('assembleTourContext', () => {
  // -------------------------------------------------------
  // Active tour mapping
  // -------------------------------------------------------
  describe('active tour', () => {
    it('maps tourId and tour.name to activeTour', () => {
      const state = createActiveTourState()
      const result = assembleTourContext(state)

      expect(result.activeTour).toEqual({
        id: 'onboarding',
        name: 'Onboarding Tour',
        currentStep: 2,
        totalSteps: 5,
      })
    })

    it('uses tourId as name when tour.name is missing', () => {
      const state = createActiveTourState({ tour: { id: 'onboarding', name: '', steps: [] } })
      const result = assembleTourContext(state)

      expect(result.activeTour?.name).toBe('onboarding')
    })

    it('maps currentStep fields to activeStep', () => {
      const state = createActiveTourState()
      const result = assembleTourContext(state)

      expect(result.activeStep).toEqual({
        id: 'step-connect',
        title: 'Connect your data source',
        content: 'Click the Add Connection button to connect your first data source.',
      })
    })

    it('returns empty string for title when step has no title', () => {
      const state = createActiveTourState({
        currentStep: {
          id: 'step-no-title',
          target: '#btn',
          content: 'Some content',
        },
      })
      const result = assembleTourContext(state)

      expect(result.activeStep?.title).toBe('')
    })

    it('returns empty string for content when step content is non-string', () => {
      const state = createActiveTourState({
        currentStep: {
          id: 'step-jsx',
          title: 'JSX Step',
          content: undefined,
          target: '#btn',
        },
      })
      const result = assembleTourContext(
        state as unknown as Parameters<typeof assembleTourContext>[0]
      )

      expect(result.activeStep?.content).toBe('')
    })

    it('sets activeStep to null when currentStep is null', () => {
      const state = createActiveTourState({ currentStep: null })
      const result = assembleTourContext(state)

      expect(result.activeStep).toBeNull()
    })
  })

  // -------------------------------------------------------
  // Inactive tour
  // -------------------------------------------------------
  describe('inactive tour', () => {
    it('returns null activeTour when isActive is false', () => {
      const state = createInactiveTourState()
      const result = assembleTourContext(state)

      expect(result.activeTour).toBeNull()
    })

    it('returns null activeStep when isActive is false', () => {
      const state = createInactiveTourState()
      const result = assembleTourContext(state)

      expect(result.activeStep).toBeNull()
    })

    it('preserves completedTours from inactive state', () => {
      const state = createInactiveTourState()
      const result = assembleTourContext(state)

      expect(result.completedTours).toEqual(['getting-started', 'workspace-setup'])
    })
  })

  // -------------------------------------------------------
  // Null / missing input
  // -------------------------------------------------------
  describe('null input', () => {
    it('returns all-null context when input is null', () => {
      const result = assembleTourContext(null)

      expect(result.activeTour).toBeNull()
      expect(result.activeStep).toBeNull()
      expect(result.completedTours).toEqual([])
      expect(result.checklistProgress).toBeNull()
    })

    it('returns all-null context when input is undefined', () => {
      const result = assembleTourContext(undefined as unknown as null)

      expect(result.activeTour).toBeNull()
      expect(result.activeStep).toBeNull()
      expect(result.completedTours).toEqual([])
      expect(result.checklistProgress).toBeNull()
    })
  })

  // -------------------------------------------------------
  // Defensive access
  // -------------------------------------------------------
  describe('defensive access', () => {
    it('handles missing tour object gracefully', () => {
      const state = createActiveTourState({ tour: null })
      const result = assembleTourContext(state)

      // Should fallback tourId as name
      expect(result.activeTour?.name).toBe('onboarding')
    })

    it('handles empty completedTours array', () => {
      const state = createActiveTourState({ completedTours: [] })
      const result = assembleTourContext(state)

      expect(result.completedTours).toEqual([])
    })

    it('always sets checklistProgress to null', () => {
      const state = createActiveTourState()
      const result = assembleTourContext(state)

      expect(result.checklistProgress).toBeNull()
    })
  })
})
