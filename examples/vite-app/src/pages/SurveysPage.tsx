import {
  type AnswerValue,
  type CESResult,
  type CSATResult,
  type DismissalReason,
  type NPSResult,
  QuestionBoolean,
  QuestionRating,
  QuestionSelect,
  QuestionText,
  type SurveyConfig,
  SurveyProgress,
  SurveysProvider,
  calculateCES,
  calculateCSAT,
  calculateNPS,
  useSurvey,
} from '@tour-kit/surveys'
import { useState } from 'react'

// ── Survey configurations ──────────────────────────────────

const surveyConfigs: SurveyConfig[] = [
  {
    id: 'nps-demo',
    type: 'nps',
    title: 'Net Promoter Score',
    description: 'How likely are you to recommend us?',
    displayMode: 'inline',
    questions: [
      {
        id: 'nps-score',
        type: 'rating',
        text: 'How likely are you to recommend Tour Kit to a friend or colleague?',
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
        type: 'text',
        text: 'What is the primary reason for your score?',
        placeholder: 'Tell us more...',
      },
    ],
  },
  {
    id: 'csat-demo',
    type: 'csat',
    title: 'Customer Satisfaction',
    description: 'How satisfied are you?',
    displayMode: 'inline',
    questions: [
      {
        id: 'csat-score',
        type: 'rating',
        text: 'How satisfied are you with Tour Kit?',
        required: true,
        ratingScale: {
          min: 1,
          max: 5,
          step: 1,
          labels: { min: 'Very unsatisfied', max: 'Very satisfied' },
        },
      },
      {
        id: 'csat-improve',
        type: 'textarea',
        text: 'What could we improve?',
        placeholder: 'Your feedback helps us improve...',
      },
    ],
  },
  {
    id: 'ces-demo',
    type: 'ces',
    title: 'Customer Effort Score',
    description: 'How easy was it?',
    displayMode: 'inline',
    questions: [
      {
        id: 'ces-score',
        type: 'rating',
        text: 'How easy was it to set up your first tour?',
        required: true,
        ratingScale: {
          min: 1,
          max: 7,
          step: 1,
          labels: { min: 'Very difficult', max: 'Very easy' },
        },
      },
      {
        id: 'ces-blocker',
        type: 'boolean',
        text: 'Did you encounter any blockers?',
      },
    ],
  },
  {
    id: 'custom-demo',
    type: 'custom',
    title: 'Product Feedback',
    description: 'Help us build what you need',
    displayMode: 'inline',
    questions: [
      {
        id: 'favorite-feature',
        type: 'single-select',
        text: 'Which feature do you use the most?',
        required: true,
        options: [
          { value: 'tours', label: 'Product Tours' },
          { value: 'hints', label: 'Hints & Hotspots' },
          { value: 'checklists', label: 'Checklists' },
          { value: 'announcements', label: 'Announcements' },
          { value: 'surveys', label: 'Surveys' },
        ],
      },
      {
        id: 'missing-feature',
        type: 'text',
        text: 'What feature are we missing?',
        placeholder: 'I wish Tour Kit had...',
      },
    ],
  },
]

// ── Score display helper ───────────────────────────────────

type ScoreResult = NPSResult | CSATResult | CESResult

function ScoreDisplay({
  result,
  scoreType,
}: {
  result: ScoreResult
  scoreType: 'nps' | 'csat' | 'ces'
}) {
  return (
    <div className="p-3 rounded-md bg-muted/50 text-sm space-y-1">
      <div className="font-medium">
        Score: {result.score}
        {scoreType === 'csat' ? '%' : ''}
      </div>
      {scoreType === 'nps' && (
        <div className="text-muted-foreground">
          Promoters: {(result as NPSResult).promoters} | Passives: {(result as NPSResult).passives}{' '}
          | Detractors: {(result as NPSResult).detractors}
        </div>
      )}
      {scoreType === 'csat' && (
        <div className="text-muted-foreground">
          Positive: {(result as CSATResult).positive} | Negative: {(result as CSATResult).negative}
        </div>
      )}
      {scoreType === 'ces' && (
        <div className="text-muted-foreground">
          Easy: {(result as CESResult).easy} | Neutral: {(result as CESResult).neutral} | Difficult:{' '}
          {(result as CESResult).difficult}
        </div>
      )}
      <div className="text-muted-foreground">Responses: {result.total}</div>
    </div>
  )
}

// ── Survey card component ──────────────────────────────────

function SurveyCard({
  surveyId,
  scoreType,
}: {
  surveyId: string
  scoreType?: 'nps' | 'csat' | 'ces'
}) {
  const { state, config, show, answer, complete, reset, canShow, nextQuestion } =
    useSurvey(surveyId)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)

  if (!config || !state) return null

  const currentQuestion = config.questions[state.currentStep]
  const isLastQuestion = state.currentStep === config.questions.length - 1
  const hasAnswer = currentQuestion ? state.responses.has(currentQuestion.id) : false

  function handleComplete() {
    complete()

    if (scoreType && state) {
      const values = Array.from(state.responses.values()).filter(
        (v): v is number => typeof v === 'number'
      )
      if (values.length > 0) {
        switch (scoreType) {
          case 'nps':
            setScoreResult(calculateNPS(values))
            break
          case 'csat':
            setScoreResult(calculateCSAT(values))
            break
          case 'ces':
            setScoreResult(calculateCES(values))
            break
        }
      }
    }
  }

  return (
    <div className="p-6 rounded-lg border bg-popover shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{config.title}</h3>
        {scoreType ? (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full uppercase">
            {scoreType}
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
            Custom
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">{config.description}</p>

      {/* Not started */}
      {!state.isVisible && !state.isCompleted && (
        <button
          type="button"
          onClick={() => show()}
          disabled={!canShow}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Start Survey
        </button>
      )}

      {/* Active survey */}
      {state.isVisible && currentQuestion && (
        <div className="space-y-4">
          <SurveyProgress current={state.currentStep + 1} total={config.questions.length} />

          {currentQuestion.type === 'rating' && (
            <QuestionRating
              id={currentQuestion.id}
              label={currentQuestion.text}
              isRequired={currentQuestion.required}
              min={currentQuestion.ratingScale?.min ?? 0}
              max={currentQuestion.ratingScale?.max ?? 10}
              lowLabel={currentQuestion.ratingScale?.labels?.min}
              highLabel={currentQuestion.ratingScale?.labels?.max}
              value={state.responses.get(currentQuestion.id) as number | undefined}
              onChange={(value: number) => answer(currentQuestion.id, value)}
            />
          )}

          {(currentQuestion.type === 'text' || currentQuestion.type === 'textarea') && (
            <QuestionText
              id={currentQuestion.id}
              label={currentQuestion.text}
              isRequired={currentQuestion.required}
              placeholder={currentQuestion.placeholder}
              mode={currentQuestion.type === 'textarea' ? 'textarea' : 'text'}
              value={(state.responses.get(currentQuestion.id) as string) ?? ''}
              onChange={(value: string) => answer(currentQuestion.id, value)}
            />
          )}

          {currentQuestion.type === 'boolean' && (
            <QuestionBoolean
              id={currentQuestion.id}
              label={currentQuestion.text}
              isRequired={currentQuestion.required}
              value={state.responses.get(currentQuestion.id) as boolean | undefined}
              onChange={(value: boolean) => answer(currentQuestion.id, value)}
            />
          )}

          {currentQuestion.type === 'single-select' && (
            <QuestionSelect
              id={currentQuestion.id}
              label={currentQuestion.text}
              isRequired={currentQuestion.required}
              options={currentQuestion.options ?? []}
              value={state.responses.get(currentQuestion.id) as string | undefined}
              onChange={(value: string | string[]) => answer(currentQuestion.id, value)}
            />
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={isLastQuestion ? handleComplete : nextQuestion}
              disabled={currentQuestion.required && !hasAnswer}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
            >
              {isLastQuestion ? 'Submit' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {/* Completed */}
      {state.isCompleted && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Survey completed!</span>
          </div>

          {scoreResult && scoreType && <ScoreDisplay result={scoreResult} scoreType={scoreType} />}

          <button
            type="button"
            onClick={() => {
              reset()
              setScoreResult(null)
            }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Reset & try again
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────

function SurveysPageContent() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header id="surveys-header" className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Surveys Demo</h1>
          <p className="text-muted-foreground">
            In-app microsurveys with NPS, CSAT, CES scoring and fatigue prevention
          </p>
        </header>

        <section>
          <h2 className="text-xl font-semibold mb-4">Try These Surveys</h2>
          <p className="text-muted-foreground mb-4">
            Click "Start Survey" to interact with each survey type. Scores are calculated
            automatically on completion.
          </p>
          <div className="grid grid-cols-1 gap-6">
            <SurveyCard surveyId="nps-demo" scoreType="nps" />
            <SurveyCard surveyId="csat-demo" scoreType="csat" />
            <SurveyCard surveyId="ces-demo" scoreType="ces" />
            <SurveyCard surveyId="custom-demo" />
          </div>
        </section>

        <section className="p-6 rounded-lg border bg-muted/50">
          <h2 className="text-lg font-semibold mb-2">How It Works</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Survey Types:</strong> NPS (0-10), CSAT (1-5), CES (1-7), and custom question
              flows
            </li>
            <li>
              <strong>Question Types:</strong> Rating scales, text input, boolean toggles, and
              single/multi-select
            </li>
            <li>
              <strong>Scoring:</strong> Automatic score calculation with category classification
              (promoter/passive/detractor for NPS)
            </li>
            <li>
              <strong>Fatigue Prevention:</strong> Global cooldown, sampling rate, max per session,
              and snooze support
            </li>
            <li>
              <strong>Display Modes:</strong> Modal, slideout, banner, popover, and inline
            </li>
            <li>
              <strong>Context Awareness:</strong> Surveys auto-suppress when a tour is active
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export function SurveysPage() {
  return (
    <SurveysProvider
      surveys={surveyConfigs}
      onSurveyShow={(id: string) => console.log(`Survey shown: ${id}`)}
      onSurveyDismiss={(id: string, reason: DismissalReason) =>
        console.log(`Survey dismissed: ${id} (${reason})`)
      }
      onSurveyComplete={(id: string, responses: Map<string, AnswerValue>) => {
        console.log(`Survey completed: ${id}`, Object.fromEntries(responses))
      }}
      onQuestionAnswered={(surveyId: string, questionId: string, value: AnswerValue) => {
        console.log(`Answer: ${surveyId}/${questionId} =`, value)
      }}
      onScoreCalculated={(
        surveyId: string,
        scoreType: string,
        result: NPSResult | CSATResult | CESResult
      ) => {
        console.log(`Score calculated: ${surveyId} (${scoreType})`, result)
      }}
    >
      <SurveysPageContent />
    </SurveysProvider>
  )
}
