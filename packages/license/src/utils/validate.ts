import * as jose from 'jose'
import type { LicensePayload, LicenseValidation } from '../types'

/**
 * Default public key for Tour Kit license validation
 * This is embedded in the package for local validation
 */
const DEFAULT_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEPLACKENS4vXSxpVhXlAIJP7e8xZL
+N7IqLaRxFG1L/wQF0eNOxHE3kEe4K7J1yMHo3pPjBF8X2hQGqZP9mGbOw==
-----END PUBLIC KEY-----`

/**
 * License key prefix
 */
const LICENSE_PREFIX = 'tk_'

/**
 * Parse a license key and extract the JWT
 */
function parseLicenseKey(licenseKey: string): string | null {
  if (!licenseKey.startsWith(LICENSE_PREFIX)) {
    return null
  }
  return licenseKey.slice(LICENSE_PREFIX.length)
}

/**
 * Import public key for verification
 */
async function importPublicKey(pem: string): Promise<jose.KeyLike> {
  return jose.importSPKI(pem, 'ES256')
}

/**
 * Validate a license key
 */
export async function validateLicense(
  licenseKey: string | undefined,
  publicKeyPem: string = DEFAULT_PUBLIC_KEY
): Promise<LicenseValidation> {
  // No license key provided
  if (!licenseKey) {
    return {
      valid: false,
      payload: null,
      error: null,
      expiresIn: null,
    }
  }

  // Parse the license key
  const jwt = parseLicenseKey(licenseKey)
  if (!jwt) {
    return {
      valid: false,
      payload: null,
      error: 'invalid_format',
      expiresIn: null,
    }
  }

  try {
    // Import the public key
    const publicKey = await importPublicKey(publicKeyPem)

    // Verify and decode the JWT
    const { payload } = await jose.jwtVerify(jwt, publicKey, {
      issuer: 'tourkit.dev',
      algorithms: ['ES256'],
    })

    // Cast to our payload type
    const licensePayload = payload as unknown as LicensePayload

    // Calculate time until expiry
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = licensePayload.exp ? (licensePayload.exp - now) * 1000 : null

    // Check if expired (jose should catch this, but double-check)
    if (expiresIn !== null && expiresIn <= 0) {
      return {
        valid: false,
        payload: licensePayload,
        error: 'expired',
        expiresIn: 0,
      }
    }

    return {
      valid: true,
      payload: licensePayload,
      error: null,
      expiresIn,
    }
  } catch (error) {
    // Handle specific jose errors
    if (error instanceof jose.errors.JWTExpired) {
      return {
        valid: false,
        payload: null,
        error: 'expired',
        expiresIn: 0,
      }
    }

    if (error instanceof jose.errors.JWTClaimValidationFailed) {
      return {
        valid: false,
        payload: null,
        error: 'not_yet_valid',
        expiresIn: null,
      }
    }

    if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
      return {
        valid: false,
        payload: null,
        error: 'invalid_signature',
        expiresIn: null,
      }
    }

    // Generic parse error
    return {
      valid: false,
      payload: null,
      error: 'parse_error',
      expiresIn: null,
    }
  }
}

/**
 * Validate domain against license limits
 */
export function validateDomain(payload: LicensePayload, currentDomain: string): boolean {
  // No domain limits
  if (!payload.limits?.maxDomains) {
    return true
  }

  // Check each allowed domain pattern
  return payload.limits.maxDomains.some((pattern) => {
    // Wildcard pattern (*.example.com)
    if (pattern.startsWith('*.')) {
      const baseDomain = pattern.slice(2)
      return currentDomain === baseDomain || currentDomain.endsWith(`.${baseDomain}`)
    }
    // Exact match
    return currentDomain === pattern
  })
}

/**
 * Get current domain (browser-only)
 */
export function getCurrentDomain(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return window.location.hostname
}
