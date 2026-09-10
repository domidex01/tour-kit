/**
 * Storage key helpers, moved verbatim from `announcements-provider.tsx` in
 * v3 Phase 3 Task 3.2. No React, no DOM — the adapter is injected.
 */
export const STORAGE_KEY_PREFIX = 'tour-kit:announcements:'

export function getStorageKey(prefix: string, id: string): string {
  return `${prefix}${id}`
}
