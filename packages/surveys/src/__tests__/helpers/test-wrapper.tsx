import type * as React from 'react'
import { SurveysProvider } from '../../context/surveys-provider'
import type { SurveyConfig } from '../../types/survey'

function createTestSurveyConfig(overrides?: Partial<SurveyConfig>): SurveyConfig {
  return {
    id: 'test-survey',
    type: 'nps',
    displayMode: 'inline',
    questions: [
      {
        id: 'q1',
        type: 'rating',
        text: 'How would you rate this?',
        ratingScale: { min: 0, max: 10 },
        required: true,
      },
    ],
    ...overrides,
  }
}

export function createTestWrapper(surveyOverrides?: Partial<SurveyConfig>) {
  const config = createTestSurveyConfig(surveyOverrides)
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <SurveysProvider surveys={[config]} storage={null}>
        {children}
      </SurveysProvider>
    )
  }
}

export { createTestSurveyConfig }
