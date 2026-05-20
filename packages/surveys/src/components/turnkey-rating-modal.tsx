'use client'

import * as React from 'react'
import type { RatingScale } from '../types/question'
import { QuestionRating } from './question-rating'
import { SurveyModal, type SurveyModalProps } from './survey-modal'

/**
 * Shared internal core for `<CsatModal>` / `<NpsModal>` / `<CesModal>`. Not
 * exported from the package barrel — the three turnkey wrappers are the
 * public API. Keeping the composition in one place avoids three drift-prone
 * copies of the open-state / Submit-disabled-until-pick / Skip-on-tertiary
 * UI rules.
 */
export interface TurnkeyRatingModalProps
  extends Omit<SurveyModalProps, 'surveyId' | 'children' | 'onSubmit' | 'onSelect'> {
  /** Survey id; defaults to a stable `React.useId()` when omitted. */
  surveyId?: string
  /** The question to ask. */
  question: string
  /** Rating scale (each wrapper provides its own default). */
  ratingScale: RatingScale
  /** Low/high anchor labels under the scale. */
  lowLabel?: string
  highLabel?: string
  /**
   * Fires with the picked rating when the user clicks Submit. Wrappers that
   * report a category (NPS/CES) compute it here and call their own `onSubmit`.
   */
  onSelect: (value: number) => void
  /** Optional skip handler; when omitted the Skip button is hidden. */
  onSkip?: () => void
  /** Initial local open state when `open` is uncontrolled. Default: true. */
  defaultOpen?: boolean
  submitLabel?: string
  skipLabel?: string
  /**
   * `data-*` attribute name stamped onto the question text (e.g.
   * `'data-csat-question'`). Wrappers pass their own tag so QA selectors
   * stay specific. Omit to skip the attribute.
   */
  questionDataAttr?: `data-${string}`
}

export function TurnkeyRatingModal({
  surveyId: surveyIdProp,
  question,
  ratingScale,
  lowLabel,
  highLabel,
  onSelect,
  onSkip,
  open: openProp,
  onOpenChange,
  defaultOpen = true,
  submitLabel = 'Submit',
  skipLabel = 'Skip',
  questionDataAttr,
  className,
  ...rest
}: TurnkeyRatingModalProps) {
  const autoId = React.useId()
  const surveyId = surveyIdProp ?? autoId
  const isControlled = openProp !== undefined
  const [localOpen, setLocalOpen] = React.useState(defaultOpen)
  const [value, setValue] = React.useState<number | null>(null)

  const open = isControlled ? openProp : localOpen

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setLocalOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  const handleSubmit = React.useCallback(() => {
    if (value === null) return
    onSelect(value)
    handleOpenChange(false)
  }, [value, onSelect, handleOpenChange])

  const handleSkip = React.useCallback(() => {
    onSkip?.()
    handleOpenChange(false)
  }, [onSkip, handleOpenChange])

  const questionAttrs = questionDataAttr ? { [questionDataAttr]: surveyId } : {}

  return (
    <SurveyModal
      surveyId={surveyId}
      open={open}
      onOpenChange={handleOpenChange}
      className={className}
      {...rest}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium" {...questionAttrs}>
          {question}
        </p>
        <QuestionRating
          id={`${surveyId}-rating`}
          label={question}
          ratingScale={ratingScale}
          lowLabel={lowLabel}
          highLabel={highLabel}
          value={value}
          onChange={setValue}
        />
        <div className="flex items-center justify-between gap-2">
          {onSkip ? (
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-muted-foreground underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {skipLabel}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={value === null}
            onClick={handleSubmit}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </SurveyModal>
  )
}
TurnkeyRatingModal.displayName = 'TurnkeyRatingModal'
