import { useSurveysContext } from '../context/surveys-context'
import type { SurveysContextValue } from '../types/context'

/**
 * Access the full surveys context.
 * Must be used within a SurveysProvider.
 */
export function useSurveys(): SurveysContextValue {
  return useSurveysContext()
}
