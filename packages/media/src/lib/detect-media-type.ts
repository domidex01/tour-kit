/**
 * URL pattern detection for the `<MediaSlot>` dispatcher.
 *
 * Pure module — zero React imports. The `PATTERNS` array order is the contract:
 * most-specific URL patterns must precede broader ones.
 */

export type MediaSlotType =
  | 'auto'
  | 'youtube'
  | 'vimeo'
  | 'loom'
  | 'wistia'
  | 'video'
  | 'gif'
  | 'lottie'
  | 'image'

export type ResolvedMediaSlotType = Exclude<MediaSlotType, 'auto'>

export const PATTERNS: ReadonlyArray<readonly [RegExp, ResolvedMediaSlotType]> = [
  [/youtu\.?be/i, 'youtube'],
  [/vimeo\.com/i, 'vimeo'],
  [/loom\.com/i, 'loom'],
  [/wistia\.com|wi\.st/i, 'wistia'],
  [/\.(mp4|webm|mov)(\?|$)/i, 'video'],
  [/\.gif(\?|$)/i, 'gif'],
  [/\.lottie$|lottiefiles\.com/i, 'lottie'],
]

export function detectMediaSlotType(src: string): ResolvedMediaSlotType {
  for (const [re, t] of PATTERNS) {
    if (re.test(src)) return t
  }
  return 'image'
}
