/**
 * Announce message to screen readers
 */
export function announce(
  message: string,
  politeness: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return

  const announcer = document.createElement('div')

  announcer.setAttribute('role', 'status')
  announcer.setAttribute('aria-live', politeness)
  announcer.setAttribute('aria-atomic', 'true')

  // Visually hidden
  Object.assign(announcer.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  })

  document.body.appendChild(announcer)

  // Delay for screen reader registration
  setTimeout(() => {
    announcer.textContent = message
  }, 100)

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(announcer)
  }, 1000)
}

/**
 * Generate unique ID for accessibility
 */
export function generateId(prefix = 'tourkit'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Generate step announcement for screen readers
 */
export function getStepAnnouncement(
  stepTitle: string | undefined,
  currentStep: number,
  totalSteps: number
): string {
  const stepInfo = `Step ${currentStep} of ${totalSteps}`
  return stepTitle ? `${stepInfo}: ${stepTitle}` : stepInfo
}
