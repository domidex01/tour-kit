import type { RatingPreset } from '../types/question'

/** Default emoji map for the generic `style: 'emoji'` rating layout. */
export const DEFAULT_EMOJI_MAP: Record<number, string> = {
  1: '\u{1F621}',
  2: '\u{1F641}',
  3: '\u{1F610}',
  4: '\u{1F642}',
  5: '\u{1F60D}',
}

export interface PresetDefaults {
  min: number
  max: number
  style: 'numeric' | 'stars' | 'emoji'
  emojiMap?: Record<number, string>
}

/**
 * Resolved defaults per `RatingPreset`. `'thumbs'` uses `1, 2, 3` (low → high)
 * so it fits the existing `RatingScale.min/max` contract without changing the
 * scoring engine.
 */
export const PRESET_DEFAULTS: Record<RatingPreset, PresetDefaults> = {
  stars: { min: 1, max: 5, style: 'stars' },
  thumbs: {
    min: 1,
    max: 3,
    style: 'emoji',
    emojiMap: {
      1: '\u{1F44E}', // 👎
      2: '\u{1F610}', // 😐
      3: '\u{1F44D}', // 👍
    },
  },
}
