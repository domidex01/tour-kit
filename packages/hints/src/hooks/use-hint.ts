import { useEffect } from 'react'
import { useHintsContext } from '../context/hints-context'

export function useHint(id: string) {
  const {
    hints,
    registerHint,
    unregisterHint,
    showHint,
    hideHint,
    dismissHint,
    resetHint,
  } = useHintsContext()
  const hint = hints.get(id)

  useEffect(() => {
    registerHint(id)
    return () => unregisterHint(id)
  }, [id, registerHint, unregisterHint])

  return {
    isOpen: hint?.isOpen ?? false,
    isDismissed: hint?.isDismissed ?? false,
    show: () => showHint(id),
    hide: () => hideHint(id),
    dismiss: () => dismissHint(id),
    reset: () => resetHint(id),
  }
}
