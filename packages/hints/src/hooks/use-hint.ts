import { useCallback, useEffect } from 'react'
import { useHintsContext } from '../context/hints-context'

export function useHint(id: string) {
  const { hints, registerHint, unregisterHint, showHint, hideHint, dismissHint, resetHint } =
    useHintsContext()
  const hint = hints.get(id)

  useEffect(() => {
    registerHint(id)
    return () => unregisterHint(id)
  }, [id, registerHint, unregisterHint])

  // Memoize callbacks to prevent infinite re-render loops when used in useEffect dependencies
  const show = useCallback(() => showHint(id), [showHint, id])
  const hide = useCallback(() => hideHint(id), [hideHint, id])
  const dismiss = useCallback(() => dismissHint(id), [dismissHint, id])
  const reset = useCallback(() => resetHint(id), [resetHint, id])

  return {
    isOpen: hint?.isOpen ?? false,
    isDismissed: hint?.isDismissed ?? false,
    show,
    hide,
    dismiss,
    reset,
  }
}
