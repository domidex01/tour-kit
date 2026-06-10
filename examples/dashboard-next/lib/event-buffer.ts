'use client'

import type { AnalyticsPlugin, TourEvent } from '@tour-kit/analytics'
import { useSyncExternalStore } from 'react'

/**
 * A tiny in-memory ring buffer of recent analytics events. Powers the
 * Director "Measure" readout (cue 5) without shipping anything to a real
 * provider — it's the on-camera, silent stand-in for the console plugin.
 */
export interface BufferedEvent {
  id: number
  name: string
  tourId?: string
  stepId?: string
  at: number
}

const MAX = 12
let buffer: BufferedEvent[] = []
let seq = 0
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function pushEvent(name: string, meta?: { tourId?: string; stepId?: string }) {
  seq += 1
  buffer = [
    { id: seq, name, tourId: meta?.tourId, stepId: meta?.stepId, at: Date.now() },
    ...buffer,
  ].slice(0, MAX)
  emit()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return buffer
}

const EMPTY: BufferedEvent[] = []
function getServerSnapshot() {
  return EMPTY
}

/** React hook returning the live event buffer (newest first). */
export function useEventBuffer(): BufferedEvent[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Analytics plugin that mirrors every Tour Kit event into the buffer.
 * Always mounted (silent); the readout subscribes via `useEventBuffer`.
 */
export function eventBufferPlugin(): AnalyticsPlugin {
  return {
    name: 'helm-event-buffer',
    track(event: TourEvent) {
      pushEvent(event.eventName, { tourId: event.tourId, stepId: event.stepId })
    },
  }
}
