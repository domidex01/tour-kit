import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import type { AnalyticsPlugin } from '../../types/plugin'
import { TourAnalytics } from '../tracker'

/**
 * Slice 5 — the `userProperties` live-vs-dead trap, guarded in ONE file.
 *
 * Two sibling fields named `userProperties` sit two declarations apart across
 * two files:
 *   - `TourEvent.userProperties`        (events.ts)  — DEAD, deleted in Slice 5.
 *   - `AnalyticsConfig.userProperties`  (plugin.ts)  — ALIVE, must stay.
 *     `tracker.ts` passes it to `identify()` inside `init()`.
 *
 * Keeping the deletion guard (D1/D2) and the live-field behaviour spy (K1) in
 * the same file makes it impossible to delete the dead one and silently regress
 * the alive one in the same cleanup pass.
 */

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(join(here, rel), 'utf8')

/** Minimal plugin whose lifecycle methods are spies. */
function spyPlugin(): AnalyticsPlugin {
  return { name: 'spy', track: vi.fn(), identify: vi.fn() }
}

describe('TourAnalytics — AnalyticsConfig.userProperties is ALIVE (K1, do not delete)', () => {
  it('passes config.userProperties to plugin.identify() on init', async () => {
    const plugin = spyPlugin()
    // init() awaits plugin `init`, then calls identify(userId, userProperties)
    // fire-and-forget on a microtask — assert async, never synchronously.
    new TourAnalytics({ plugins: [plugin], userId: 'u', userProperties: { plan: 'pro' } })

    await vi.waitFor(() => expect(plugin.identify).toHaveBeenCalledWith('u', { plan: 'pro' }))
  })

  it('does not call identify() when no userId is configured', async () => {
    const plugin = spyPlugin()
    new TourAnalytics({ plugins: [plugin], userProperties: { plan: 'pro' } })
    // Give init()'s microtask a chance to run before asserting the negative.
    await Promise.resolve()
    await Promise.resolve()
    expect(plugin.identify).not.toHaveBeenCalled()
  })
})

describe('Slice 5 deletion guards — dead userProperties / offlineQueue are gone (D1/D2)', () => {
  it('TourEvent no longer declares userProperties (events.ts)', () => {
    expect(read('../../types/events.ts')).not.toMatch(/userProperties/)
  })

  it('AnalyticsConfig STILL declares userProperties — the kept live field (plugin.ts)', () => {
    // Defends the KEEP verdict from a future over-zealous scan-and-delete.
    expect(read('../../types/plugin.ts')).toMatch(/userProperties\?: Record<string, unknown>/)
  })

  it('offlineQueue is gone from the config type and the tracker (plugin.ts, tracker.ts)', () => {
    expect(read('../../types/plugin.ts')).not.toMatch(/offlineQueue/)
    expect(read('../tracker.ts')).not.toMatch(/offlineQueue/)
  })
})
