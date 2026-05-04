import type { MediaSlotProps } from '@tour-kit/media'
import type { AnnouncementMedia } from '../types/announcement'

const ASPECT_RATIOS = ['16/9', '4/3', '1/1', '9/16', '21/9', 'auto'] as const
type AspectRatio = (typeof ASPECT_RATIOS)[number]

function isAspectRatio(value: string | undefined): value is AspectRatio {
  return value !== undefined && (ASPECT_RATIOS as readonly string[]).includes(value)
}

/**
 * Convert `AnnouncementMedia` into the strict `MediaSlotProps` shape that
 * `<MediaSlot>` expects.
 *
 * `AnnouncementMedia.aspectRatio` is typed `string` (broad) for legacy
 * reasons; `MediaSlotProps.aspectRatio` is the narrow `AspectRatio` union.
 * This adapter narrows via runtime guard so all announcement variants honor
 * the field consistently.
 */
export function toMediaSlotProps(m: AnnouncementMedia): MediaSlotProps {
  return {
    src: m.src,
    type: m.type,
    alt: m.alt,
    poster: m.poster,
    aspectRatio: isAspectRatio(m.aspectRatio) ? m.aspectRatio : undefined,
    autoplay: m.autoplay,
    loop: m.loop,
    muted: m.muted,
  }
}
