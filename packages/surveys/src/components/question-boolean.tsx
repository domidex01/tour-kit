'use client'

import * as React from 'react'
import { cn } from '../lib/utils'
import { booleanOptionVariants } from './ui/question-variants'

export interface QuestionBooleanProps {
  /** Unique identifier for the boolean group */
  id: string
  /** Controlled value */
  value?: boolean | null
  /** Change handler */
  onChange?: (value: boolean) => void
  /** Accessible label for the group */
  label: string
  /** Label for the "yes" option */
  yesLabel?: string
  /** Label for the "no" option */
  noLabel?: string
  /** Whether a selection is required */
  isRequired?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional class names */
  className?: string
}

const QuestionBoolean = React.forwardRef<HTMLDivElement, QuestionBooleanProps>(
  (
    {
      id,
      value: controlledValue,
      onChange,
      label,
      yesLabel = 'Yes',
      noLabel = 'No',
      isRequired = false,
      size = 'md',
      className,
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = React.useState<boolean | null>(null)
    const [focusedIndex, setFocusedIndex] = React.useState(0)

    const currentValue = isControlled ? controlledValue : internalValue

    const boolOptions = React.useMemo<Array<{ value: boolean; label: string }>>(
      () => [
        { value: true, label: yesLabel },
        { value: false, label: noLabel },
      ],
      [yesLabel, noLabel]
    )

    const selectValue = React.useCallback(
      (val: boolean) => {
        if (!isControlled) {
          setInternalValue(val)
        }
        onChange?.(val)
      },
      [isControlled, onChange]
    )

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        let nextIndex = focusedIndex

        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            event.preventDefault()
            nextIndex = (focusedIndex + 1) % 2
            break
          case 'ArrowLeft':
          case 'ArrowUp':
            event.preventDefault()
            nextIndex = (focusedIndex - 1 + 2) % 2
            break
          case ' ':
          case 'Enter':
            event.preventDefault()
            selectValue(boolOptions[focusedIndex].value)
            return
          default:
            return
        }

        setFocusedIndex(nextIndex)
        const container = (event.currentTarget as HTMLElement).closest(
          `[data-boolean-group="${id}"]`
        )
        const buttons = container?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
        buttons?.[nextIndex]?.focus()
      },
      [focusedIndex, selectValue, boolOptions, id]
    )

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={label}
        aria-required={isRequired}
        data-boolean-group={id}
        className={cn('flex gap-2', className)}
      >
        {boolOptions.map((option, index) => {
          const isSelected = currentValue === option.value

          return (
            <button
              key={String(option.value)}
              type="button"
              // biome-ignore lint/a11y/useSemanticElements: custom radio group pattern; native <input type=radio> doesn't support the required styling/keyboard semantics
              role="radio"
              aria-checked={isSelected}
              aria-label={option.label}
              tabIndex={index === focusedIndex ? 0 : -1}
              className={cn(
                booleanOptionVariants({
                  size,
                  selected: isSelected,
                })
              )}
              onClick={() => {
                setFocusedIndex(index)
                selectValue(option.value)
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocusedIndex(index)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    )
  }
)
QuestionBoolean.displayName = 'QuestionBoolean'

export { QuestionBoolean }
