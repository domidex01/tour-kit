'use client'

import { Button } from '@/components/ui/button'
import { QuestionRating, SurveyModal, useSurvey } from '@tour-kit/surveys'

export function CsatSurveyHost() {
  const survey = useSurvey('onboarding-csat')
  const rating = survey.state?.responses.get('q1') as number | undefined
  const hasAnswer = typeof rating === 'number'

  return (
    <SurveyModal surveyId="onboarding-csat">
      <div className="mt-4 flex flex-col gap-4">
        <QuestionRating
          id="q1"
          ratingScale={{ min: 1, max: 5 }}
          style="stars"
          size="lg"
          label="How would you rate the walkthrough?"
          lowLabel="Not great"
          highLabel="Loved it"
          isRequired
          value={rating ?? null}
          onChange={(v) => survey.answer('q1', v)}
        />
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => survey.dismiss('programmatic')}>
            Skip
          </Button>
          <Button size="sm" disabled={!hasAnswer} onClick={() => survey.complete()}>
            Submit
          </Button>
        </div>
      </div>
    </SurveyModal>
  )
}
