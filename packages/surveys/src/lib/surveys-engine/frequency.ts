/**
 * The six fatigue gates, moved verbatim from `surveys-provider.tsx` in v3
 * Phase 3 Task 3.7. Pure predicates over numbers and dates.
 *
 * `userRoll` is a parameter rather than a `Math.random()` call so a fatigue
 * test can be deterministic; the engine seeds it once at construction from an
 * injectable `random`, exactly as the provider seeded it once per mount from
 * `useState(() => Math.random())` (plan Decision 7).
 */
import type { EngineSurveyConfig, SurveyState } from './types'

export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / msPerDay)
}

export function passesSampling(effectiveSampling: number, userRoll: number): boolean {
  return userRoll < effectiveSampling
}

export function passesGlobalCooldown(
  effectiveCooldownDays: number | undefined,
  lastShownAt: Date | null,
  now: Date
): boolean {
  if (effectiveCooldownDays === undefined || !lastShownAt) return true
  return daysBetween(lastShownAt, now) >= effectiveCooldownDays
}

export function passesSessionLimit(
  effectiveMax: number | undefined,
  sessionShowCount: number
): boolean {
  return effectiveMax === undefined || sessionShowCount < effectiveMax
}

export function passesSnoozeLimit(
  maxSnoozeCount: number | undefined,
  snoozeCount: number
): boolean {
  return maxSnoozeCount === undefined || snoozeCount < maxSnoozeCount
}

export interface SurveyGateInput {
  config: EngineSurveyConfig
  surveyState: SurveyState
  userRoll: number
  providerSamplingRate: number
  providerGlobalCooldownDays: number | undefined
  providerMaxPerSession: number | undefined
  lastShownAt: Date | null
  sessionShowCount: number
  now: Date
}

export function passesFrequencyGates(input: SurveyGateInput): boolean {
  const { config, surveyState } = input
  const effectiveSampling = Math.min(input.providerSamplingRate, config.samplingRate ?? 1)
  if (!passesSampling(effectiveSampling, input.userRoll)) return false
  const effectiveCooldown = config.globalCooldownDays ?? input.providerGlobalCooldownDays
  if (!passesGlobalCooldown(effectiveCooldown, input.lastShownAt, input.now)) return false
  const effectiveMax = config.maxPerSession ?? input.providerMaxPerSession
  if (!passesSessionLimit(effectiveMax, input.sessionShowCount)) return false
  return passesSnoozeLimit(config.maxSnoozeCount, surveyState.snoozeCount)
}
