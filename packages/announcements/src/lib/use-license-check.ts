type LicenseStatus = 'valid' | 'invalid' | 'expired' | 'revoked' | 'loading' | 'error'

interface LicenseCheckResult {
  isLicensed: boolean
  isLoading: boolean
}

type LicenseModule = {
  useLicense: () => { state: { status: LicenseStatus }; refresh: () => Promise<void> }
}

let licenseModule: LicenseModule | null | undefined

function getLicenseModule(): LicenseModule | null {
  if (licenseModule !== undefined) return licenseModule
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    licenseModule = require('@tour-kit/license')
  } catch {
    licenseModule = null
  }
  return licenseModule ?? null
}

export function useLicenseCheck(): LicenseCheckResult {
  const mod = getLicenseModule()

  if (!mod) {
    return { isLicensed: true, isLoading: false }
  }

  try {
    const { state } = mod.useLicense()
    return {
      isLicensed:
        state.status === 'valid' || state.status === 'loading' || state.status === 'error',
      isLoading: state.status === 'loading',
    }
  } catch {
    // useLicense() threw — likely no LicenseProvider in tree
    return { isLicensed: false, isLoading: false }
  }
}
