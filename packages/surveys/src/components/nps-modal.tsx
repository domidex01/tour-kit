'use client'

import { type NpsCategory, computeNpsCategory } from '../core/scoring'
import type { RatingScale } from '../types/question'
import type { SurveyModalProps } from './survey-modal'
import { TurnkeyRatingModal } from './turnkey-rating-modal'

export interface NpsModalProps
  extends Omit<SurveyModalProps, 'surveyId' | 'children' | 'onSubmit' | 'onSelect'> {
  /** Survey id; defaults to a stable `React.useId()` when omitted. */
  surveyId?: string
  /** The question to ask (e.g. "How likely are you to recommend us?"). */
  question: string
  /** Override the default 0–10 scale; rarely needed. */
  ratingScale?: RatingScale
  /** Anchor labels under the scale; defaults match the canonical NPS endpoints. */
  lowLabel?: string
  highLabel?: string
  /** Submit handler; receives the raw score and the NPS category. */
  onSubmit: (score: number, category: NpsCategory) => void
  /** Optional skip handler; when omitted the Skip button is hidden. */
  onSkip?: () => void
  /** Initial local open state when `open` is uncontrolled. Default: true. */
  defaultOpen?: boolean
  submitLabel?: string
  skipLabel?: string
}

const DEFAULT_SCALE: RatingScale = { min: 0, max: 10, style: 'numeric' }

export function NpsModal({
  ratingScale,
  lowLabel = 'Not likely',
  highLabel = 'Very likely',
  onSubmit,
  ...rest
}: NpsModalProps) {
  return (
    <TurnkeyRatingModal
      {...rest}
      ratingScale={ratingScale ?? DEFAULT_SCALE}
      lowLabel={lowLabel}
      highLabel={highLabel}
      onSelect={(value) => onSubmit(value, computeNpsCategory(value))}
      questionDataAttr="data-nps-question"
    />
  )
}
NpsModal.displayName = 'NpsModal'
