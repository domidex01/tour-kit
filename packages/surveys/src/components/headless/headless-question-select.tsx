'use client'

import * as React from 'react'
import type { SelectOption } from '../../types/question'

export interface HeadlessQuestionSelectRenderProps {
  /** Current value (string for single, string[] for multi) */
  value: string | string[]
  /** Set the value */
  setValue: (value: string | string[]) => void
  /** Options array */
  options: SelectOption[]
  /** Props to spread on the group container */
  groupProps: {
    role: 'radiogroup' | 'group'
    'aria-label': string
    'aria-required': boolean | undefined
  }
  /** Get props for a specific option */
  getOptionProps: (optionValue: string) => {
    role: 'radio' | 'checkbox'
    'aria-checked': boolean
    'aria-disabled': boolean | undefined
    'aria-label': string
    tabIndex: number
  }
}

export interface HeadlessQuestionSelectProps {
  /** Unique identifier */
  id: string
  /** Selection mode */
  mode?: 'single' | 'multi'
  /** Options */
  options: SelectOption[]
  /** Accessible label */
  label: string
  /** Whether required */
  isRequired?: boolean
  /** Controlled value */
  value?: string | string[]
  /** Change handler */
  onChange?: (value: string | string[]) => void
  /** Render prop receiving headless state and props */
  children: (props: HeadlessQuestionSelectRenderProps) => React.ReactNode
}

export function HeadlessQuestionSelect({
  mode = 'single',
  options,
  label,
  isRequired,
  value: controlledValue,
  onChange,
  children,
}: HeadlessQuestionSelectProps) {
  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = React.useState<string | string[]>(
    mode === 'multi' ? [] : ''
  )
  const focusedIndex = 0

  const currentValue = isControlled ? controlledValue : internalValue

  const enabledOptions = React.useMemo(() => options.filter((opt) => !opt.disabled), [options])

  const setValue = React.useCallback(
    (val: string | string[]) => {
      if (!isControlled) setInternalValue(val)
      onChange?.(val)
    },
    [isControlled, onChange]
  )

  const isSelected = React.useCallback(
    (optionValue: string): boolean => {
      if (mode === 'multi') {
        return Array.isArray(currentValue) && currentValue.includes(optionValue)
      }
      return currentValue === optionValue
    },
    [currentValue, mode]
  )

  const groupProps = {
    role: (mode === 'multi' ? 'group' : 'radiogroup') as 'radiogroup' | 'group',
    'aria-label': label,
    'aria-required': isRequired || undefined,
  }

  const getOptionProps = React.useCallback(
    (optionValue: string) => {
      const option = options.find((o) => o.value === optionValue)
      const disabled = option?.disabled ?? false
      const optionLabel = option?.label ?? optionValue

      if (mode === 'multi') {
        return {
          role: 'checkbox' as const,
          'aria-checked': isSelected(optionValue),
          'aria-disabled': disabled || undefined,
          'aria-label': optionLabel,
          tabIndex: disabled ? -1 : 0,
        }
      }

      const enabledIdx = enabledOptions.findIndex((o) => o.value === optionValue)
      return {
        role: 'radio' as const,
        'aria-checked': isSelected(optionValue),
        'aria-disabled': disabled || undefined,
        'aria-label': optionLabel,
        tabIndex: disabled ? -1 : enabledIdx === focusedIndex ? 0 : -1,
      }
    },
    [options, enabledOptions, mode, isSelected]
  )

  return children({
    value: currentValue,
    setValue,
    options,
    groupProps,
    getOptionProps,
  }) as React.ReactElement
}

HeadlessQuestionSelect.displayName = 'HeadlessQuestionSelect'
