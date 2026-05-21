import type * as React from 'react'

/**
 * Arguments handed to a {@link ToastAdapter.render} call. The provider
 * pre-renders the toast's content tree (`<AnnouncementContent /> +
 * <AnnouncementActions />`) and hands it to the adapter; the adapter is
 * responsible only for the *transport* (Sonner, react-hot-toast, etc.).
 */
export interface ToastAdapterRenderArgs {
  /** Announcement id (not the underlying toast handle id). */
  id: string
  /** Pre-rendered content node to display inside the toast. */
  content: React.ReactNode
  /** Display options. */
  options?: {
    duration?: number
    position?:
      | 'top-left'
      | 'top-center'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-center'
      | 'bottom-right'
  }
  /** Invoked when the toast is dismissed by the user or auto-close. */
  onDismiss?: () => void
}

/**
 * A handle returned by a successful {@link ToastAdapter.render} call. The
 * provider uses {@link dismiss} to imperatively close the toast (e.g., on
 * unmount or programmatic dismiss).
 */
export interface ToastAdapterHandle {
  /** Stable id assigned by the underlying transport. */
  id: string
  /** Dismiss this toast. */
  dismiss: () => void
}

/**
 * Public contract for routing `variant="toast"` announcements through an
 * external toast library (Sonner, react-hot-toast, etc.).
 *
 * Pass an adapter to `<AnnouncementsProvider toastAdapter={...}>`. When
 * present, the provider invokes `render(...)` for each toast-variant
 * announcement instead of mounting the built-in `<AnnouncementToast>` portal.
 *
 * Returning `null` from `render` signals fallback — the provider then renders
 * the built-in portal toast for that announcement. This is the path the
 * Sonner adapter takes when `sonner` is not installed.
 */
export interface ToastAdapter {
  /** Stable id for the adapter (`'sonner'`, `'react-hot-toast'`, …). */
  id: string
  /**
   * Render the toast via the adapter. Return `null` to indicate the provider
   * should fall back to the built-in portal toast.
   */
  render: (args: ToastAdapterRenderArgs) => Promise<ToastAdapterHandle | null>
  /** Optional explicit dismissal hook. */
  dismiss?: (handle: ToastAdapterHandle) => void
}
