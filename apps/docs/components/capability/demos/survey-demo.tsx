'use client'

import {
  type NPSResult,
  QuestionRating,
  QuestionText,
  type SurveyConfig,
  SurveyProgress,
  SurveysProvider,
  calculateNPS,
  useSurvey,
} from '@tour-kit/surveys'
import { RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { DemoSurface } from './demo-surface'
import { MaybeLicensed } from './maybe-licensed'

/**
 * The real @tour-kit/surveys NPS flow running inline. Demo-only provider
 * settings: `storage={null}` (in-memory, fresh every visit) and
 * `globalCooldownDays={0}` — with the defaults (localStorage + 14-day
 * cooldown) a visitor could complete the demo exactly once, ever.
 */
const DEMO_SURVEY: SurveyConfig = {
  id: 'capability-demo-nps',
  type: 'nps',
  title: 'Quick question',
  description: 'Two questions, in context — the live component.',
  displayMode: 'inline',
  questions: [
    {
      id: 'nps-score',
      type: 'rating',
      text: 'How likely are you to recommend Acme to a colleague?',
      required: true,
      ratingScale: {
        min: 0,
        max: 10,
        step: 1,
        labels: { min: 'Not likely', max: 'Very likely' },
      },
    },
    {
      id: 'nps-reason',
      type: 'textarea',
      text: 'What is the main reason for your score?',
      placeholder: 'Optional — tell us more…',
    },
  ],
}

function npsBucket(result: NPSResult): string {
  if (result.promoters > 0) return 'a promoter'
  if (result.passives > 0) return 'a passive'
  return 'a detractor'
}

function DemoQuestion({
  question,
  value,
  onAnswer,
}: {
  question: SurveyConfig['questions'][number]
  value: unknown
  onAnswer: (questionId: string, value: number | string) => void
}) {
  if (question.type === 'rating') {
    return (
      <QuestionRating
        id={question.id}
        label={question.text as string}
        isRequired={question.required}
        min={question.ratingScale?.min ?? 0}
        max={question.ratingScale?.max ?? 10}
        lowLabel={(question.ratingScale?.labels?.min as string) || undefined}
        highLabel={(question.ratingScale?.labels?.max as string) || undefined}
        value={value as number | undefined}
        onChange={(next: number) => onAnswer(question.id, next)}
      />
    )
  }
  if (question.type === 'textarea') {
    return (
      <QuestionText
        id={question.id}
        label={question.text as string}
        isRequired={question.required}
        placeholder={(question.placeholder as string) || undefined}
        mode="textarea"
        value={(value as string) ?? ''}
        onChange={(next: string) => onAnswer(question.id, next)}
      />
    )
  }
  return null
}

function DemoSurveyCard() {
  const { state, config, show, answer, complete, reset, nextQuestion } = useSurvey(DEMO_SURVEY.id)
  const [result, setResult] = useState<NPSResult | null>(null)
  const shown = useRef(false)

  // Auto-show once on mount — a marketing demo should be visible immediately,
  // not gated behind a "start survey" click.
  useEffect(() => {
    if (!shown.current && state && !state.isVisible && !state.isCompleted) {
      shown.current = true
      show()
    }
  }, [state, show])

  if (!config || !state) return null

  const currentQuestion = config.questions[state.currentStep]
  const isLastQuestion = state.currentStep === config.questions.length - 1
  const hasAnswer = currentQuestion ? state.responses.has(currentQuestion.id) : false

  function handleComplete() {
    if (!state) return
    const score = state.responses.get('nps-score')
    if (typeof score === 'number') setResult(calculateNPS([score]))
    complete()
  }

  function handleReset() {
    setResult(null)
    shown.current = false
    reset()
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-fd-border bg-fd-background p-5 shadow-lg">
      <div className="mb-4">
        <h3 className="text-[15px] font-bold text-fd-foreground">{DEMO_SURVEY.title as string}</h3>
        <p className="text-[13px] text-fd-muted-foreground">{DEMO_SURVEY.description as string}</p>
      </div>

      {state.isVisible && currentQuestion ? (
        <div className="space-y-4">
          <SurveyProgress current={state.currentStep + 1} total={config.questions.length} />

          <DemoQuestion
            question={currentQuestion}
            value={state.responses.get(currentQuestion.id)}
            onAnswer={answer}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={isLastQuestion ? handleComplete : nextQuestion}
              disabled={currentQuestion.required && !hasAnswer}
              className="rounded-lg bg-[#0197f6] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0197f6]"
            >
              {isLastQuestion ? 'Submit' : 'Next'}
            </button>
          </div>
        </div>
      ) : null}

      {state.isCompleted ? (
        <div className="space-y-3" aria-live="polite">
          <p className="text-[14px] font-semibold text-emerald-600 dark:text-emerald-400">
            Thanks — response captured.
          </p>
          {result ? (
            <p className="text-[13px] leading-relaxed text-fd-muted-foreground">
              That score makes you <strong>{npsBucket(result)}</strong> — classified live by{' '}
              <code className="rounded bg-fd-muted px-1.5 py-0.5 font-mono text-[11.5px]">
                calculateNPS()
              </code>
              . In your app this lands in your own analytics, not ours.
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-background px-2.5 py-1.5 font-mono text-[11px] font-semibold text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0197f6]"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Retake demo
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function SurveyDemo() {
  return (
    <MaybeLicensed>
      <SurveysProvider
        surveys={[DEMO_SURVEY]}
        storage={null}
        globalCooldownDays={0}
        samplingRate={1}
        maxPerSession={99}
      >
        <DemoSurface url="acme.app/dashboard" contentClassName="bg-fd-muted/20 py-10">
          <DemoSurveyCard />
        </DemoSurface>
      </SurveysProvider>
    </MaybeLicensed>
  )
}
