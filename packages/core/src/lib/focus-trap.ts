/**
 * v2 §1.3b — `use-focus-trap.ts`'s body as a plain factory.
 *
 * RED STUB. The real implementation lands in the next commit.
 */
export interface FocusTrapOptions {
  inertBackground?: boolean
}

export interface FocusTrap {
  capture(): void
  forget(): void
  activate(): void
  deactivate(): void
  release(): void
}

export function createFocusTrap(
  _getContainer: () => HTMLElement | null,
  _options: FocusTrapOptions = {}
): FocusTrap {
  const notYet = () => {
    throw new Error('createFocusTrap: not implemented')
  }
  return { capture: notYet, forget: notYet, activate: notYet, deactivate: notYet, release: notYet }
}
