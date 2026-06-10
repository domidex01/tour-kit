'use client'

import { computeNpsCategory, SurveySlideout, useSurvey } from '@tour-kit/surveys'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

/** Director cue 4 fires this to open the NPS slideout deterministically. */
export const NPS_OPEN_EVENT = 'helm-director:nps-open'
/** Fired by hideAll() between reel takes to close the slideout. */
export const NPS_CLOSE_EVENT = 'helm-director:nps-close'

/**
 * Director cue 4 — an NPS micro-survey that slides in from the right corner.
 *
 * Driven in *controlled* mode so it always opens on cue: the provider's
 * `canShow` gate suppresses surveys while a tour is active or inside the
 * global cooldown, which would make the reel non-deterministic. We still
 * record the response through `useSurvey('nps-pulse')` for analytics.
 */
export function NpsSlideoutHost() {
  const survey = useSurvey('nps-pulse')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    const onOpen = () => {
      setSelected(null)
      setOpen(true)
    }
    const onClose = () => setOpen(false)
    window.addEventListener(NPS_OPEN_EVENT, onOpen)
    window.addEventListener(NPS_CLOSE_EVENT, onClose)
    return () => {
      window.removeEventListener(NPS_OPEN_EVENT, onOpen)
      window.removeEventListener(NPS_CLOSE_EVENT, onClose)
    }
  }, [])

  const submit = (score: number) => {
    setSelected(score)
    survey.answer('nps', score)
    survey.complete()
    toast.success(`NPS captured: ${score} → ${computeNpsCategory(score)}`)
    setTimeout(() => {
      setOpen(false)
      setSelected(null)
    }, 650)
  }

  return (
    <SurveySlideout
      surveyId="nps-pulse"
      position="right"
      size="sm"
      open={open}
      onOpenChange={(next) => {
        if (!next) setOpen(false)
      }}
    >
      <div className="mt-4">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => submit(n)}
              aria-label={`Rate ${n} out of 10`}
              className={`h-9 w-9 rounded-md border text-sm font-medium tabular-nums transition ${
                selected === n
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:border-primary hover:text-primary'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
      </div>
    </SurveySlideout>
  )
}
