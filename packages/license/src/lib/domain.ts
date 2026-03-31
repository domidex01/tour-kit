const DEV_HOSTNAMES = ['localhost', '127.0.0.1']
const DEV_SUFFIX = '.local'

export function getCurrentDomain(): string | null {
  if (typeof window === 'undefined') return null
  return window.location.hostname
}

export function isDevEnvironment(): boolean {
  const domain = getCurrentDomain()
  if (!domain) return false
  return DEV_HOSTNAMES.includes(domain) || domain.endsWith(DEV_SUFFIX)
}

/**
 * Compares current hostname against the stored activation label.
 * Logs a console warning on mismatch. Soft enforcement only —
 * returns boolean but never blocks rendering.
 */
export function validateDomainAtRender(activationLabel: string): boolean {
  const currentDomain = getCurrentDomain()
  if (!currentDomain) return true // SSR — cannot check, assume ok
  if (isDevEnvironment()) return true // dev — always pass

  if (currentDomain !== activationLabel) {
    console.warn(
      `[tour-kit/license] Domain mismatch: license activated for "${activationLabel}" but running on "${currentDomain}". Components will render with a watermark. Activate this domain in your Polar dashboard or contact support.`
    )
    return false
  }
  return true
}
