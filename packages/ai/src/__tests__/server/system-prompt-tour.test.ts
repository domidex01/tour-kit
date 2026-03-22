import { describe, expect, it } from 'vitest'
import type { TourAssistantContext } from '../../hooks/use-tour-assistant'
import { createSystemPrompt } from '../../server/system-prompt'

/** Fixture: active tour context */
const activeTourContext: TourAssistantContext = {
  activeTour: {
    id: 'onboarding',
    name: 'Onboarding Tour',
    currentStep: 2,
    totalSteps: 5,
  },
  activeStep: {
    id: 'step-connect',
    title: 'Connect your data source',
    content: 'Click the Add Connection button to connect your first data source.',
  },
  completedTours: ['getting-started'],
  checklistProgress: null,
}

/** Fixture: no active tour context */
const inactiveTourContext: TourAssistantContext = {
  activeTour: null,
  activeStep: null,
  completedTours: ['getting-started', 'workspace-setup'],
  checklistProgress: null,
}

describe('createSystemPrompt — tour context injection', () => {
  // -------------------------------------------------------
  // With active tour context
  // -------------------------------------------------------
  describe('with active tour context', () => {
    it('appends "Current User Context" section', () => {
      const prompt = createSystemPrompt({ tourContext: activeTourContext })

      expect(prompt).toContain('## Current User Context')
    })

    it('includes tour name in context section', () => {
      const prompt = createSystemPrompt({ tourContext: activeTourContext })

      expect(prompt).toContain('Onboarding Tour')
    })

    it('includes step number (1-indexed) and total steps', () => {
      const prompt = createSystemPrompt({ tourContext: activeTourContext })

      expect(prompt).toContain('step 3 of 5')
    })

    it('includes active step title', () => {
      const prompt = createSystemPrompt({ tourContext: activeTourContext })

      expect(prompt).toContain('Connect your data source')
    })

    it('includes active step content', () => {
      const prompt = createSystemPrompt({ tourContext: activeTourContext })

      expect(prompt).toContain('Click the Add Connection button to connect your first data source.')
    })

    it('includes completed tours list', () => {
      const prompt = createSystemPrompt({ tourContext: activeTourContext })

      expect(prompt).toContain('getting-started')
    })

    it('combines tour context with other prompt layers', () => {
      const prompt = createSystemPrompt({
        productName: 'Acme',
        tone: 'friendly',
        tourContext: activeTourContext,
      })

      // Layer 1
      expect(prompt).toContain('Grounding')
      // Layer 2
      expect(prompt).toContain('Acme')
      // Tour context
      expect(prompt).toContain('Current User Context')
      expect(prompt).toContain('Onboarding Tour')
    })

    it('tour context section appears after other layers', () => {
      const prompt = createSystemPrompt({
        productName: 'Acme',
        tourContext: activeTourContext,
      })

      const groundingIndex = prompt.indexOf('Grounding')
      const tourContextIndex = prompt.indexOf('Current User Context')
      expect(tourContextIndex).toBeGreaterThan(groundingIndex)
    })
  })

  // -------------------------------------------------------
  // With active tour but no active step
  // -------------------------------------------------------
  describe('with active tour but no active step', () => {
    it('includes tour info but omits step details', () => {
      const contextNoStep: TourAssistantContext = {
        ...activeTourContext,
        activeStep: null,
      }
      const prompt = createSystemPrompt({ tourContext: contextNoStep })

      expect(prompt).toContain('Current User Context')
      expect(prompt).toContain('Onboarding Tour')
      expect(prompt).not.toContain('Step title')
    })
  })

  // -------------------------------------------------------
  // Without tour context
  // -------------------------------------------------------
  describe('without tour context', () => {
    it('does not include "Current User Context" when tourContext is undefined', () => {
      const prompt = createSystemPrompt({ productName: 'Acme' })

      expect(prompt).not.toContain('Current User Context')
    })

    it('does not include "Current User Context" when activeTour is null', () => {
      const prompt = createSystemPrompt({
        tourContext: inactiveTourContext,
      })

      expect(prompt).not.toContain('Current User Context')
    })
  })

  // -------------------------------------------------------
  // Completed tours formatting
  // -------------------------------------------------------
  describe('completed tours formatting', () => {
    it('shows "No tours completed yet." when completedTours is empty', () => {
      const context: TourAssistantContext = {
        ...activeTourContext,
        completedTours: [],
      }
      const prompt = createSystemPrompt({ tourContext: context })

      expect(prompt).toContain('No tours completed yet.')
    })

    it('joins multiple completed tours with commas', () => {
      const context: TourAssistantContext = {
        ...activeTourContext,
        completedTours: ['tour-a', 'tour-b', 'tour-c'],
      }
      const prompt = createSystemPrompt({ tourContext: context })

      expect(prompt).toContain('tour-a, tour-b, tour-c')
    })
  })
})
