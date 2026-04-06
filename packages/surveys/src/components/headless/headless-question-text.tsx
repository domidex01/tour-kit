'use client'

import * as React from 'react'

export interface HeadlessQuestionTextRenderProps {
  /** Current text value */
  value: string
  /** Set the text value */
  setValue: (value: string) => void
  /** Current character count */
  characterCount: number
  /** Whether the character limit has been reached */
  isAtLimit: boolean
  /** Props to spread on the input/textarea element */
  inputProps: {
    id: string
    'aria-label': string
    'aria-required': boolean | undefined
    'aria-describedby': string | undefined
    value: string
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    maxLength: number | undefined
    placeholder: string | undefined
  }
  /** Props for the character count element */
  characterCountProps: {
    id: string
    'aria-live': 'polite'
  }
}

export interface HeadlessQuestionTextProps {
  /** Unique identifier */
  id: string
  /** Accessible label */
  label: string
  /** Whether required */
  isRequired?: boolean
  /** Controlled value */
  value?: string
  /** Change handler */
  onChange?: (value: string) => void
  /** Maximum character length */
  maxLength?: number
  /** Placeholder text */
  placeholder?: string
  /** Whether to include character count aria-describedby */
  showCharacterCount?: boolean
  /** Render prop receiving headless state and props */
  children: (props: HeadlessQuestionTextRenderProps) => React.ReactNode
}

export function HeadlessQuestionText({
  id,
  label,
  isRequired,
  value: controlledValue,
  onChange,
  maxLength,
  placeholder,
  showCharacterCount = false,
  children,
}: HeadlessQuestionTextProps) {
  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = React.useState('')

  const currentValue = isControlled ? controlledValue : internalValue
  const characterCount = currentValue.length
  const isAtLimit = maxLength !== undefined && characterCount >= maxLength

  const charCountId = `${id}-char-count`

  const setValue = React.useCallback(
    (val: string) => {
      if (!isControlled) setInternalValue(val)
      onChange?.(val)
    },
    [isControlled, onChange]
  )

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(event.target.value)
    },
    [setValue]
  )

  const inputProps = {
    id,
    'aria-label': label,
    'aria-required': isRequired || undefined,
    'aria-describedby': showCharacterCount ? charCountId : undefined,
    value: currentValue,
    onChange: handleChange,
    maxLength,
    placeholder,
  }

  const characterCountProps = {
    id: charCountId,
    'aria-live': 'polite' as const,
  }

  return children({
    value: currentValue,
    setValue,
    characterCount,
    isAtLimit,
    inputProps,
    characterCountProps,
  }) as React.ReactElement
}

HeadlessQuestionText.displayName = 'HeadlessQuestionText'
