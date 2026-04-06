'use client'

import * as React from 'react'

export interface HeadlessQuestionRatingRenderProps {
  /** Currently selected value */
  value: number | null
  /** Set the selected value */
  setValue: (value: number) => void
  /** Array of option values in the scale */
  options: number[]
  /** Index of the currently focused option */
  focusedIndex: number
  /** Set the focused index */
  setFocusedIndex: (index: number) => void
  /** Props to spread on the rating group container */
  ratingGroupProps: {
    role: 'radiogroup'
    'aria-label': string
    'aria-required': boolean | undefined
  }
  /** Get props for a specific rating option */
  getOptionProps: (optionValue: number) => {
    role: 'radio'
    'aria-checked': boolean
    'aria-label': string
    tabIndex: number
  }
}

export interface HeadlessQuestionRatingProps {
  /** Unique identifier */
  id: string
  /** Minimum value (default: 0) */
  min?: number
  /** Maximum value (default: 10) */
  max?: number
  /** Accessible label */
  label: string
  /** Whether required */
  isRequired?: boolean
  /** Controlled value */
  value?: number | null
  /** Change handler */
  onChange?: (value: number) => void
  /** Render prop receiving headless state and props */
  children: (props: HeadlessQuestionRatingRenderProps) => React.ReactNode
}

export function HeadlessQuestionRating({
  min = 0,
  max = 10,
  label,
  isRequired,
  value: controlledValue,
  onChange,
  children,
}: HeadlessQuestionRatingProps) {
  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = React.useState<number | null>(null)
  const [focusedIndex, setFocusedIndex] = React.useState(0)

  const currentValue = isControlled ? controlledValue : internalValue

  const options = React.useMemo(() => {
    const result: number[] = []
    for (let i = min; i <= max; i++) {
      result.push(i)
    }
    return result
  }, [min, max])

  const setValue = React.useCallback(
    (val: number) => {
      if (!isControlled) setInternalValue(val)
      onChange?.(val)
    },
    [isControlled, onChange]
  )

  const ratingGroupProps = {
    role: 'radiogroup' as const,
    'aria-label': label,
    'aria-required': isRequired || undefined,
  }

  const getOptionProps = React.useCallback(
    (optionValue: number) => {
      const index = options.indexOf(optionValue)
      return {
        role: 'radio' as const,
        'aria-checked': currentValue === optionValue,
        'aria-label': `Rate ${optionValue} out of ${max}`,
        tabIndex: index === focusedIndex ? 0 : -1,
      }
    },
    [currentValue, focusedIndex, options, max]
  )

  return children({
    value: currentValue,
    setValue,
    options,
    focusedIndex,
    setFocusedIndex,
    ratingGroupProps,
    getOptionProps,
  }) as React.ReactElement
}

HeadlessQuestionRating.displayName = 'HeadlessQuestionRating'
