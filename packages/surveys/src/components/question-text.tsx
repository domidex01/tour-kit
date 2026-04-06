'use client'

import * as React from 'react'
import { cn } from '../lib/utils'
import { textInputVariants } from './ui/question-variants'

export interface QuestionTextProps {
  /** Unique identifier for the text input */
  id: string
  /** Input mode: single-line text or multi-line textarea */
  mode?: 'text' | 'textarea'
  /** Controlled value */
  value?: string
  /** Change handler */
  onChange?: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Maximum character length */
  maxLength?: number
  /** Whether to show the character count */
  showCharacterCount?: boolean
  /** Number of rows for textarea mode */
  rows?: number
  /** Whether an answer is required */
  isRequired?: boolean
  /** Accessible label */
  label: string
  /** Whether to autofocus the input */
  isAutoFocus?: boolean
  /** Additional class names */
  className?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

const QuestionText = React.forwardRef<HTMLDivElement, QuestionTextProps>(
  (
    {
      id,
      mode = 'text',
      value: controlledValue,
      onChange,
      placeholder,
      maxLength,
      showCharacterCount = false,
      rows = 3,
      isRequired = false,
      label,
      isAutoFocus = false,
      className,
      size = 'md',
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = React.useState('')

    const currentValue = isControlled ? controlledValue : internalValue
    const characterCount = currentValue.length
    const isAtLimit = maxLength !== undefined && characterCount >= maxLength

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = event.target.value
        if (!isControlled) {
          setInternalValue(newValue)
        }
        onChange?.(newValue)
      },
      [isControlled, onChange]
    )

    const charCountId = `${id}-char-count`

    const sharedProps = {
      id,
      'aria-label': label,
      'aria-required': isRequired,
      'aria-describedby': showCharacterCount ? charCountId : undefined,
      placeholder,
      maxLength,
      value: currentValue,
      onChange: handleChange,
      autoFocus: isAutoFocus,
    }

    return (
      <div ref={ref} className={cn('flex flex-col gap-1', className)}>
        {mode === 'textarea' ? (
          <textarea
            {...sharedProps}
            rows={rows}
            className={cn(textInputVariants({ size }), 'h-auto py-2 resize-y')}
          />
        ) : (
          <input {...sharedProps} type="text" className={cn(textInputVariants({ size }))} />
        )}
        {showCharacterCount && (
          <span
            id={charCountId}
            className={cn(
              'text-xs text-muted-foreground text-right',
              isAtLimit && 'text-destructive'
            )}
            aria-live="polite"
          >
            {characterCount}
            {maxLength !== undefined ? ` / ${maxLength}` : ''}
          </span>
        )}
      </div>
    )
  }
)
QuestionText.displayName = 'QuestionText'

export { QuestionText }
