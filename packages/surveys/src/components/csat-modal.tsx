'use client'

import type { RatingScale } from '../types/question'
import type { SurveyModalProps } from './survey-modal'
import { TurnkeyRatingModal } from './turnkey-rating-modal'

export interface CsatModalProps
  extends Omit<SurveyModalProps, 'surveyId' | 'children' | 'onSubmit' | 'onSelect'> {
  /** Survey id; defaults to a stable `React.useId()` when omitted. */
  surveyId?: string
  /** The question to ask (e.g. "How easy was checkout?"). */
  question: string
  /** Rating scale override; default is the canonical CSAT preset (1–5 numeric). */
  ratingScale?: RatingScale
  /** Optional low/high anchor labels under the scale. */
  lowLabel?: string
  highLabel?: string
  /** Submit handler; fires with the selected rating value. */
  onSubmit: (rating: number) => void
  /** Optional skip handler; when omitted the Skip button is hidden. */
  onSkip?: () => void
  /** Initial local open state when `open` is uncontrolled. Default: true. */
  defaultOpen?: boolean
  submitLabel?: string
  skipLabel?: string
}

const DEFAULT_SCALE: RatingScale = { min: 1, max: 5, style: 'numeric' }

export function CsatModal({ ratingScale, onSubmit, ...rest }: CsatModalProps) {
  return (
    <TurnkeyRatingModal
      {...rest}
      ratingScale={ratingScale ?? DEFAULT_SCALE}
      onSelect={onSubmit}
      questionDataAttr="data-csat-question"
    />
  )
}
CsatModal.displayName = 'CsatModal'
