'use client'

import * as React from 'react'
import type { RatingPreset, RatingScale } from '../../types/question'
import { DEFAULT_EMOJI_MAP, PRESET_DEFAULTS } from '../rating-presets'

export interface HeadlessQuestionRatingRenderProps {
  /** Currently selected value */
  value: number | null
  /** Set the selected value */
  setValue: (value: number) => void
  /** Array of option values in the scale */
  options: number[]
  /** Resolved minimum value (after preset/ratingScale precedence) */
  min: number
  /** Resolved maximum value (after preset/ratingScale precedence) */
  max: number
  /** Resolved visual style (after preset/ratingScale precedence) */
  style: 'numeric' | 'stars' | 'emoji'
  /** Resolved emoji map (preset thumbs map, custom prop, or `DEFAULT_EMOJI_MAP`) */
  emojiMap: Record<number, string>
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
  /** Visual style (default: 'numeric') */
  style?: 'numeric' | 'stars' | 'emoji'
  /** Custom emoji map for `style: 'emoji'` */
  emojiMap?: Record<number, string>
  /** Accessible label */
  label: string
  /** Whether required */
  isRequired?: boolean
  /** Controlled value */
  value?: number | null
  /** Change handler */
  onChange?: (value: number) => void
  /**
   * Optional rating preset that fills in `min`/`max`/`style`/`emojiMap`
   * defaults. Per-field nullish-merging precedence:
   *   `ratingScale` > explicit prop > preset default > hardcoded fallback.
   */
  preset?: RatingPreset
  /**
   * Explicit rating scale. Per-field nullish-merging — a partial
   * `ratingScale` (e.g. `{ min, max }` without `style`) lets the preset's
   * `style` win for that one field.
   */
  ratingScale?: RatingScale
  /** Render prop receiving headless state and props */
  children: (props: HeadlessQuestionRatingRenderProps) => React.ReactNode
}

export function HeadlessQuestionRating({
  min: minProp,
  max: maxProp,
  style: styleProp,
  emojiMap: emojiMapProp,
  label,
  isRequired,
  value: controlledValue,
  onChange,
  preset,
  ratingScale,
  children,
}: HeadlessQuestionRatingProps) {
  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = React.useState<number | null>(null)
  const [focusedIndex, setFocusedIndex] = React.useState(0)

  const currentValue = isControlled ? controlledValue : internalValue

  const presetDefaults = preset ? PRESET_DEFAULTS[preset] : undefined
  const min = ratingScale?.min ?? minProp ?? presetDefaults?.min ?? 0
  const max = ratingScale?.max ?? maxProp ?? presetDefaults?.max ?? 10
  const style = ratingScale?.style ?? styleProp ?? presetDefaults?.style ?? 'numeric'
  const emojiMap = emojiMapProp ?? presetDefaults?.emojiMap ?? DEFAULT_EMOJI_MAP

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
    min,
    max,
    style,
    emojiMap,
    focusedIndex,
    setFocusedIndex,
    ratingGroupProps,
    getOptionProps,
  }) as React.ReactElement
}

HeadlessQuestionRating.displayName = 'HeadlessQuestionRating'
