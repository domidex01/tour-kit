'use client'

import * as React from 'react'

export interface HeadlessQuestionBooleanRenderProps {
  /** Currently selected value */
  value: boolean | null
  /** Set the selected value */
  setValue: (value: boolean) => void
  /** Props to spread on the group container */
  groupProps: {
    role: 'radiogroup'
    'aria-label': string
    'aria-required': boolean | undefined
  }
  /** Get props for a boolean option */
  getOptionProps: (booleanValue: boolean) => {
    role: 'radio'
    'aria-checked': boolean
    'aria-label': string
    tabIndex: number
  }
}

export interface HeadlessQuestionBooleanProps {
  /** Unique identifier */
  id: string
  /** Accessible label */
  label: string
  /** Label for the "yes" option */
  yesLabel?: string
  /** Label for the "no" option */
  noLabel?: string
  /** Whether required */
  isRequired?: boolean
  /** Controlled value */
  value?: boolean | null
  /** Change handler */
  onChange?: (value: boolean) => void
  /** Render prop receiving headless state and props */
  children: (props: HeadlessQuestionBooleanRenderProps) => React.ReactNode
}

export function HeadlessQuestionBoolean({
  label,
  yesLabel = 'Yes',
  noLabel = 'No',
  isRequired,
  value: controlledValue,
  onChange,
  children,
}: HeadlessQuestionBooleanProps) {
  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = React.useState<boolean | null>(null)
  const focusedIndex = 0

  const currentValue = isControlled ? controlledValue : internalValue

  const setValue = React.useCallback(
    (val: boolean) => {
      if (!isControlled) setInternalValue(val)
      onChange?.(val)
    },
    [isControlled, onChange]
  )

  const groupProps = {
    role: 'radiogroup' as const,
    'aria-label': label,
    'aria-required': isRequired || undefined,
  }

  const getOptionProps = React.useCallback(
    (booleanValue: boolean) => {
      const index = booleanValue ? 0 : 1
      const optionLabel = booleanValue ? yesLabel : noLabel
      return {
        role: 'radio' as const,
        'aria-checked': currentValue === booleanValue,
        'aria-label': optionLabel,
        tabIndex: index === focusedIndex ? 0 : -1,
      }
    },
    [currentValue, focusedIndex, yesLabel, noLabel]
  )

  return children({
    value: currentValue,
    setValue,
    groupProps,
    getOptionProps,
  }) as React.ReactElement
}

HeadlessQuestionBoolean.displayName = 'HeadlessQuestionBoolean'
