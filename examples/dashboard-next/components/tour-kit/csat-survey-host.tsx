'use client'

import { CsatModal, useSurvey } from '@tour-kit/surveys'

/**
 * Phase 2 (v2-package-polish): swapped from the hand-composed
 * `<SurveyModal>` + `<QuestionRating>` + Skip/Submit assembly to the turnkey
 * `<CsatModal>` wrapper. We still wire the `open` state through
 * `useSurvey('onboarding-csat')` so the frequency rule + demo trigger
 * (`reset()` then `show()`) keep working end-to-end.
 */
export function CsatSurveyHost() {
  const survey = useSurvey('onboarding-csat')

  return (
    <CsatModal
      surveyId="onboarding-csat"
      question="How would you rate the walkthrough?"
      ratingScale={{ min: 1, max: 5, style: 'stars' }}
      lowLabel="Not great"
      highLabel="Loved it"
      open={survey.state?.isVisible ?? false}
      onOpenChange={(next) => {
        if (!next) survey.hide()
      }}
      onSubmit={(rating) => {
        survey.answer('q1', rating)
        survey.complete()
      }}
      onSkip={() => survey.dismiss('programmatic')}
    />
  )
}
