'use client'

import { type CesCategory, computeCesCategory } from '../core/scoring'
import type { RatingScale } from '../types/question'
import type { SurveyModalProps } from './survey-modal'
import { TurnkeyRatingModal } from './turnkey-rating-modal'

export interface CesModalProps
  extends Omit<SurveyModalProps, 'surveyId' | 'children' | 'onSubmit' | 'onSelect'> {
  /** Survey id; defaults to a stable `React.useId()` when omitted. */
  surveyId?: string
  /** The question to ask (e.g. "How easy was that?"). */
  question: string
  /** Override the default 1–7 scale; rarely needed. */
  ratingScale?: RatingScale
  /** Anchor labels under the scale; defaults match the canonical CES endpoints. */
  lowLabel?: string
  highLabel?: string
  /** Submit handler; receives the raw score and the CES category. */
  onSubmit: (score: number, category: CesCategory) => void
  /** Optional skip handler; when omitted the Skip button is hidden. */
  onSkip?: () => void
  /** Initial local open state when `open` is uncontrolled. Default: true. */
  defaultOpen?: boolean
  submitLabel?: string
  skipLabel?: string
}

const DEFAULT_SCALE: RatingScale = { min: 1, max: 7, style: 'numeric' }

export function CesModal({
  ratingScale,
  lowLabel = 'Very difficult',
  highLabel = 'Very easy',
  onSubmit,
  ...rest
}: CesModalProps) {
  return (
    <TurnkeyRatingModal
      {...rest}
      ratingScale={ratingScale ?? DEFAULT_SCALE}
      lowLabel={lowLabel}
      highLabel={highLabel}
      onSelect={(value) => onSubmit(value, computeCesCategory(value))}
      questionDataAttr="data-ces-question"
    />
  )
}
CesModal.displayName = 'CesModal'
