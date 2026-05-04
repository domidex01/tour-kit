'use client'

import { MediaSlot } from '@tour-kit/media'
import * as React from 'react'
import type { QuestionConfig } from '../types/question'

export interface QuestionMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The question whose `media?` should render. No-op when absent. */
  question: Pick<QuestionConfig, 'media'>
}

/**
 * Renders `<MediaSlot>` above a question prompt when the question has a
 * `media?` field. Returns `null` when no media is configured so consumers
 * can mount it unconditionally above their `Question*` component.
 *
 * @example
 * ```tsx
 * <QuestionMedia question={currentQuestion} />
 * <QuestionRating ... />
 * ```
 */
export const QuestionMedia = React.forwardRef<HTMLDivElement, QuestionMediaProps>(
  ({ question, className, ...rest }, ref) => {
    if (!question.media) return null
    return (
      <div ref={ref} data-slot="question-media" className={className} {...rest}>
        <MediaSlot {...question.media} />
      </div>
    )
  }
)
QuestionMedia.displayName = 'QuestionMedia'
