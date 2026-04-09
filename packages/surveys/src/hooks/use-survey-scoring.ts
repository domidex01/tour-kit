import { useMemo } from 'react'
import { useSurveysContext } from '../context/surveys-context'
import { calculateCES, calculateCSAT, calculateNPS } from '../core/scoring'
import type { CESResult, CSATResult, NPSResult } from '../types/scoring'

interface UseSurveyScoringReturn {
  calculateNPS: (responses: number[]) => NPSResult
  calculateCSAT: (responses: number[], threshold?: number) => CSATResult
  calculateCES: (responses: number[]) => CESResult
  getSurveyScore: (surveyId: string) => NPSResult | CSATResult | CESResult | null
}

/**
 * Access scoring utilities for surveys.
 * Must be used within a SurveysProvider.
 */
export function useSurveyScoring(): UseSurveyScoringReturn {
  const ctx = useSurveysContext()

  return useMemo(
    () => ({
      calculateNPS,
      calculateCSAT,
      calculateCES,
      getSurveyScore(surveyId: string) {
        const state = ctx.getState(surveyId)
        const config = ctx.getConfig(surveyId)
        if (!state || !config || !state.isCompleted) return null

        const values = Array.from(state.responses.values()).filter(
          (v): v is number => typeof v === 'number'
        )
        if (values.length === 0) return null

        switch (config.type) {
          case 'nps':
            return calculateNPS(values)
          case 'csat':
            return calculateCSAT(values)
          case 'ces':
            return calculateCES(values)
          default:
            return null
        }
      },
    }),
    [ctx]
  )
}
