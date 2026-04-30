'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'
import { ratingOptionVariants } from './ui/question-variants'

/** Default emoji map for emoji rating style */
const DEFAULT_EMOJI_MAP: Record<number, string> = {
  1: '\u{1F621}',
  2: '\u{1F641}',
  3: '\u{1F610}',
  4: '\u{1F642}',
  5: '\u{1F60D}',
}

export interface QuestionRatingProps {
  /** Unique identifier for the rating group */
  id: string
  /** Minimum rating value (default: 0) */
  min?: number
  /** Maximum rating value (default: 10) */
  max?: number
  /** Visual style variant */
  style?: 'numeric' | 'stars' | 'emoji'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Controlled value */
  value?: number | null
  /** Change handler */
  onChange?: (value: number) => void
  /** Accessible label for the rating group */
  label: string
  /** Label for the low end of the scale */
  lowLabel?: string
  /** Label for the high end of the scale */
  highLabel?: string
  /** Whether a selection is required */
  isRequired?: boolean
  /** Custom emoji map for emoji style */
  emojiMap?: Record<number, string>
  /** Additional class names */
  className?: string
}

const QuestionRating = React.forwardRef<HTMLDivElement, QuestionRatingProps>(
  (
    {
      id,
      min = 0,
      max = 10,
      style = 'numeric',
      size = 'md',
      value: controlledValue,
      onChange,
      label,
      lowLabel,
      highLabel,
      isRequired = false,
      emojiMap,
      className,
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = React.useState<number | null>(null)
    const [focusedIndex, setFocusedIndex] = React.useState(0)

    const currentValue = isControlled ? controlledValue : internalValue

    const step = 1
    const options: number[] = React.useMemo(() => {
      const result: number[] = []
      for (let i = min; i <= max; i += step) {
        result.push(i)
      }
      return result
    }, [min, max])

    const resolvedEmojiMap = emojiMap ?? DEFAULT_EMOJI_MAP

    const selectValue = React.useCallback(
      (val: number) => {
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
            nextIndex = (focusedIndex + 1) % options.length
            break
          case 'ArrowLeft':
          case 'ArrowUp':
            event.preventDefault()
            nextIndex = (focusedIndex - 1 + options.length) % options.length
            break
          case 'Home':
            event.preventDefault()
            nextIndex = 0
            break
          case 'End':
            event.preventDefault()
            nextIndex = options.length - 1
            break
          case ' ':
          case 'Enter': {
            event.preventDefault()
            const chosen = options[focusedIndex]
            if (chosen !== undefined) selectValue(chosen)
            return
          }
          default:
            return
        }

        setFocusedIndex(nextIndex)
        // Focus the button at the new index
        const container = (event.currentTarget as HTMLElement).closest(
          `[data-rating-group="${id}"]`
        )
        const buttons = container?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
        buttons?.[nextIndex]?.focus()
      },
      [focusedIndex, options, selectValue, id]
    )

    const getOptionLabel = (val: number): string => {
      if (style === 'stars') {
        return `Rate ${val} out of ${max}`
      }
      if (style === 'emoji') {
        return `Rate ${val} out of ${max}`
      }
      return `Rate ${val} out of ${max}`
    }

    const getOptionContent = (val: number): React.ReactNode => {
      if (style === 'stars') {
        const filled = currentValue !== null && currentValue !== undefined && val <= currentValue
        return (
          <>
            <span aria-hidden="true">{filled ? '\u2605' : '\u2606'}</span>
            <span className="sr-only">{getOptionLabel(val)}</span>
          </>
        )
      }
      if (style === 'emoji') {
        return (
          <>
            <span aria-hidden="true">{resolvedEmojiMap[val] ?? val}</span>
            <span className="sr-only">{getOptionLabel(val)}</span>
          </>
        )
      }
      return val
    }

    return (
      <div ref={ref} className={cn('flex flex-col gap-2', className)}>
        <div
          role="radiogroup"
          aria-label={label}
          aria-required={isRequired}
          data-rating-group={id}
          className="flex flex-wrap gap-1"
        >
          {options.map((val, index) => {
            const isSelected = currentValue === val

            return (
              <button
                key={val}
                type="button"
                // biome-ignore lint/a11y/useSemanticElements: custom radio group pattern; native <input type=radio> doesn't support the required styling/keyboard semantics
                role="radio"
                aria-checked={isSelected}
                aria-label={getOptionLabel(val)}
                tabIndex={index === focusedIndex ? 0 : -1}
                className={cn(
                  ratingOptionVariants({
                    size,
                    style,
                    selected: isSelected,
                  })
                )}
                onClick={() => {
                  setFocusedIndex(index)
                  selectValue(val)
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocusedIndex(index)}
              >
                {getOptionContent(val)}
              </button>
            )
          })}
        </div>
        {(lowLabel || highLabel) && (
          <div className="flex justify-between text-xs text-muted-foreground">
            {lowLabel && <span>{lowLabel}</span>}
            {highLabel && <span>{highLabel}</span>}
          </div>
        )}
      </div>
    )
  }
)
QuestionRating.displayName = 'QuestionRating'

export { QuestionRating }
