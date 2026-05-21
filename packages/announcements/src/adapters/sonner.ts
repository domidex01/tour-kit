'use client'

import * as React from 'react'
import type {
  ToastAdapter,
  ToastAdapterHandle,
  ToastAdapterRenderArgs,
} from '../types/toast-adapter'

let warned = false
function warnOnce(msg: string): void {
  if (warned) return
  // Allow warnings in production too — consumers benefit from one-time visibility
  // when they misconfigure (e.g., forgot to render <Toaster />). The warned flag
  // keeps it bounded to one message per page load.
  warned = true
  console.warn(`[tour-kit] ${msg}`)
}

/**
 * Peer-optional Sonner adapter.
 *
 * Consumer setup:
 *   1. `pnpm add sonner` (>=1.0.0 <3)
 *   2. Render `<Toaster />` from `'sonner'` once in the app shell.
 *   3. Pass this adapter to `<AnnouncementsProvider toastAdapter={sonnerAdapter}>`.
 *
 * If `sonner` is missing or its `toast()` export is unavailable (e.g., major
 * version mismatch), `render` returns `null` and emits a one-time dev warning;
 * the provider then falls back to the built-in `<AnnouncementToast>` portal.
 *
 * The dynamic `import('sonner')` lives inside `render` so this file remains
 * loadable even when `sonner` is not installed.
 */
export const sonnerAdapter: ToastAdapter = {
  id: 'sonner',

  async render({
    content,
    options,
    onDismiss,
  }: ToastAdapterRenderArgs): Promise<ToastAdapterHandle | null> {
    let sonner: typeof import('sonner') | null = null
    try {
      sonner = await import('sonner')
    } catch {
      warnOnce('sonnerAdapter could not load sonner — falling back to portal toast.')
      return null
    }

    if (
      !sonner ||
      typeof sonner.toast !== 'function' ||
      typeof sonner.toast.custom !== 'function'
    ) {
      warnOnce(
        'sonnerAdapter loaded sonner but toast.custom() is unavailable — falling back to portal toast.'
      )
      return null
    }

    if (typeof document !== 'undefined' && !document.querySelector('[data-sonner-toaster]')) {
      warnOnce(
        'sonnerAdapter requires <Toaster /> to be rendered in your app. See https://sonner.emilkowal.ski/getting-started.'
      )
    }

    // toast.custom expects React.ReactElement; wrap content (ReactNode) in a
    // Fragment so any node — including strings, numbers, or arrays — passes
    // the type contract without forcing a JSX file extension.
    const toastId = sonner.toast.custom(() => React.createElement(React.Fragment, null, content), {
      duration: options?.duration ?? 5000,
      position: options?.position ?? 'bottom-right',
      onDismiss,
    })

    // Capture sonner reference for the dismiss closure since the outer var
    // could be re-narrowed in TS.
    const sonnerRef = sonner
    return {
      id: String(toastId),
      dismiss: () => sonnerRef.toast.dismiss(toastId),
    }
  },

  dismiss(handle: ToastAdapterHandle): void {
    handle?.dismiss()
  },
}
