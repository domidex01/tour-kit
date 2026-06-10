'use client'

import { type CesCategory, CesModal, type NpsCategory, NpsModal } from '@tour-kit/surveys'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

/**
 * Phase 2 (v2-package-polish): fire-and-forget NPS + CES turnkey demos.
 *
 * Both modals are pure consumer-state — no SurveysProvider config, no
 * frequency rules, no persistence. The demo trigger fires a DOM
 * `CustomEvent` from the demo panel; this host listens for it, toggles
 * local state, and renders the modal. On submit we surface the captured
 * `(score, category)` via a sonner toast so testers can confirm the
 * callback fired with the right arity and bucketing.
 */

export const TURNKEY_NPS_EVENT = 'tour-kit-demo:turnkey-nps'
export const TURNKEY_CES_EVENT = 'tour-kit-demo:turnkey-ces'
/** Director "clear stage" — dismiss both turnkey modals. */
export const TURNKEY_CLOSE_EVENT = 'tour-kit-demo:turnkey-close'

export function TurnkeySurveyHosts() {
  const [showNps, setShowNps] = useState(false)
  const [showCes, setShowCes] = useState(false)

  useEffect(() => {
    const openNps = () => setShowNps(true)
    const openCes = () => setShowCes(true)
    const closeBoth = () => {
      setShowNps(false)
      setShowCes(false)
    }
    window.addEventListener(TURNKEY_NPS_EVENT, openNps)
    window.addEventListener(TURNKEY_CES_EVENT, openCes)
    window.addEventListener(TURNKEY_CLOSE_EVENT, closeBoth)
    return () => {
      window.removeEventListener(TURNKEY_NPS_EVENT, openNps)
      window.removeEventListener(TURNKEY_CES_EVENT, openCes)
      window.removeEventListener(TURNKEY_CLOSE_EVENT, closeBoth)
    }
  }, [])

  return (
    <>
      {showNps && (
        <NpsModal
          question="How likely are you to recommend Helm?"
          onSubmit={(score: number, category: NpsCategory) => {
            toast.success(`NPS captured: ${score} → ${category}`)
            setShowNps(false)
          }}
          onSkip={() => setShowNps(false)}
          onOpenChange={(next) => {
            if (!next) setShowNps(false)
          }}
        />
      )}
      {showCes && (
        <CesModal
          question="How easy was the dashboard onboarding?"
          onSubmit={(score: number, category: CesCategory) => {
            toast.success(`CES captured: ${score} → ${category}`)
            setShowCes(false)
          }}
          onSkip={() => setShowCes(false)}
          onOpenChange={(next) => {
            if (!next) setShowCes(false)
          }}
        />
      )}
    </>
  )
}
