import { useHintsContext } from '../context/hints-context'

export function useHints() {
  const context = useHintsContext()

  return {
    hints: Array.from(context.hints.values()),
    activeHint: context.activeHint,
    showHint: context.showHint,
    hideHint: context.hideHint,
    dismissHint: context.dismissHint,
    resetHint: context.resetHint,
    resetAllHints: context.resetAllHints,
    isHintVisible: (id: string) => context.hints.get(id)?.isOpen ?? false,
    isHintDismissed: (id: string) => context.hints.get(id)?.isDismissed ?? false,
  }
}
