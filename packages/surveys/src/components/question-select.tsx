'use client'

import * as React from 'react'
import { cn } from '../lib/utils'
import type { SelectOption } from '../types/question'
import { selectOptionVariants } from './ui/question-variants'

export interface QuestionSelectProps {
  /** Unique identifier for the select group */
  id: string
  /** Selection mode: single or multi */
  mode?: 'single' | 'multi'
  /** Options to display */
  options: SelectOption[]
  /** Controlled value — string for single, string[] for multi */
  value?: string | string[]
  /** Change handler — string for single, string[] for multi */
  onChange?: (value: string | string[]) => void
  /** Accessible label for the group */
  label: string
  /** Whether a selection is required */
  isRequired?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional class names */
  className?: string
}

const QuestionSelect = React.forwardRef<HTMLDivElement, QuestionSelectProps>(
  (
    {
      id,
      mode = 'single',
      options,
      value: controlledValue,
      onChange,
      label,
      isRequired = false,
      size = 'md',
      className,
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = React.useState<string | string[]>(
      mode === 'multi' ? [] : ''
    )

    const currentValue = isControlled ? controlledValue : internalValue

    const enabledOptions = React.useMemo(() => options.filter((opt) => !opt.disabled), [options])

    // Roving tabindex for single-select mode
    const [focusedIndex, setFocusedIndex] = React.useState(0)

    const isSelected = React.useCallback(
      (optionValue: string): boolean => {
        if (mode === 'multi') {
          return Array.isArray(currentValue) && currentValue.includes(optionValue)
        }
        return currentValue === optionValue
      },
      [currentValue, mode]
    )

    const selectSingle = React.useCallback(
      (optionValue: string) => {
        if (!isControlled) {
          setInternalValue(optionValue)
        }
        onChange?.(optionValue)
      },
      [isControlled, onChange]
    )

    const toggleMulti = React.useCallback(
      (optionValue: string) => {
        const current = Array.isArray(currentValue) ? currentValue : []
        const next = current.includes(optionValue)
          ? current.filter((v) => v !== optionValue)
          : [...current, optionValue]
        if (!isControlled) {
          setInternalValue(next)
        }
        onChange?.(next)
      },
      [currentValue, isControlled, onChange]
    )

    const handleSingleKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        if (enabledOptions.length === 0) return

        let nextIndex = focusedIndex

        switch (event.key) {
          case 'ArrowDown':
          case 'ArrowRight':
            event.preventDefault()
            nextIndex = (focusedIndex + 1) % enabledOptions.length
            break
          case 'ArrowUp':
          case 'ArrowLeft':
            event.preventDefault()
            nextIndex = (focusedIndex - 1 + enabledOptions.length) % enabledOptions.length
            break
          case 'Home':
            event.preventDefault()
            nextIndex = 0
            break
          case 'End':
            event.preventDefault()
            nextIndex = enabledOptions.length - 1
            break
          case ' ':
          case 'Enter': {
            event.preventDefault()
            const chosen = enabledOptions[focusedIndex]
            if (chosen !== undefined) selectSingle(chosen.value)
            return
          }
          default:
            return
        }

        setFocusedIndex(nextIndex)
        const nextOpt = enabledOptions[nextIndex]
        if (nextOpt !== undefined) selectSingle(nextOpt.value)

        // Focus the element at the new index
        const container = (event.currentTarget as HTMLElement).closest(
          `[data-select-group="${id}"]`
        )
        const elems = container?.querySelectorAll<HTMLDivElement>(
          '[role="radio"]:not([aria-disabled="true"])'
        )
        elems?.[nextIndex]?.focus()
      },
      [focusedIndex, enabledOptions, selectSingle, id]
    )

    const handleMultiKeyDown = React.useCallback(
      (event: React.KeyboardEvent, optionValue: string) => {
        if (event.key === ' ') {
          event.preventDefault()
          toggleMulti(optionValue)
        }
      },
      [toggleMulti]
    )

    if (mode === 'multi') {
      return (
        <div
          ref={ref}
          // biome-ignore lint/a11y/useSemanticElements: role=group container; <fieldset> brings default styling that breaks the design system
          role="group"
          aria-label={label}
          aria-required={isRequired}
          data-select-group={id}
          className={cn('flex flex-col gap-2', className)}
        >
          {options.map((option) => {
            const selected = isSelected(option.value)
            const disabled = option.disabled ?? false

            return (
              <div
                key={option.value}
                // biome-ignore lint/a11y/useSemanticElements: custom checkbox pattern; native <input type=checkbox> cannot be styled to match the design system
                role="checkbox"
                aria-checked={selected}
                aria-disabled={disabled || undefined}
                aria-label={option.label}
                tabIndex={disabled ? -1 : 0}
                className={cn(
                  selectOptionVariants({
                    size,
                    selected,
                    disabled,
                  })
                )}
                onClick={() => {
                  if (!disabled) toggleMulti(option.value)
                }}
                onKeyDown={(e) => {
                  if (!disabled) handleMultiKeyDown(e, option.value)
                }}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                    selected ? 'bg-primary border-primary text-primary-foreground' : 'border-input'
                  )}
                  aria-hidden="true"
                >
                  {selected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      className="h-3 w-3"
                      aria-hidden="true"
                    >
                      <title>Selected</title>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span>{option.label}</span>
              </div>
            )
          })}
        </div>
      )
    }

    // Single-select mode
    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={label}
        aria-required={isRequired}
        data-select-group={id}
        className={cn('flex flex-col gap-2', className)}
      >
        {options.map((option) => {
          const selected = isSelected(option.value)
          const disabled = option.disabled ?? false
          const enabledIdx = enabledOptions.findIndex((o) => o.value === option.value)
          const isFocusTarget = enabledIdx === focusedIndex

          return (
            <div
              key={option.value}
              // biome-ignore lint/a11y/useSemanticElements: custom radio pattern; native <input type=radio> cannot be styled to match the design system
              role="radio"
              aria-checked={selected}
              aria-disabled={disabled || undefined}
              aria-label={option.label}
              tabIndex={disabled ? -1 : isFocusTarget ? 0 : -1}
              className={cn(
                selectOptionVariants({
                  size,
                  selected,
                  disabled,
                })
              )}
              onClick={() => {
                if (!disabled) {
                  setFocusedIndex(enabledIdx >= 0 ? enabledIdx : 0)
                  selectSingle(option.value)
                }
              }}
              onKeyDown={disabled ? undefined : handleSingleKeyDown}
              onFocus={() => {
                if (!disabled && enabledIdx >= 0) {
                  setFocusedIndex(enabledIdx)
                }
              }}
            >
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                  selected ? 'border-primary' : 'border-input'
                )}
                aria-hidden="true"
              >
                {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>
              <span>{option.label}</span>
            </div>
          )
        })}
      </div>
    )
  }
)
QuestionSelect.displayName = 'QuestionSelect'

export { QuestionSelect }
