import type { LicenseState } from '../../types'

export const LOADING_STATE: LicenseState = {
  status: 'loading',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: 0,
  renderKey: undefined,
}

export const VALID_PRO_STATE: LicenseState = {
  status: 'valid',
  tier: 'pro',
  activations: 1,
  maxActivations: 5,
  domain: 'example.com',
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'lk_abc123hash',
}

export const VALID_FREE_STATE: LicenseState = {
  status: 'valid',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'lk_free456hash',
}

export const INVALID_STATE: LicenseState = {
  status: 'invalid',
  tier: 'free',
  activations: 0,
  maxActivations: 5,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: undefined,
}

export const EXPIRED_STATE: LicenseState = {
  status: 'expired',
  tier: 'pro',
  activations: 1,
  maxActivations: 5,
  domain: 'example.com',
  expiresAt: '2025-01-01T00:00:00Z',
  validatedAt: Date.now(),
  renderKey: undefined,
}

export const ERROR_STATE: LicenseState = {
  status: 'error',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: undefined,
}

export const DEV_BYPASS_STATE: LicenseState = {
  status: 'valid',
  tier: 'pro',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: Date.now(),
  renderKey: 'dev_bypass',
}
