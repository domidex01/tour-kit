/**
 * PHASE 0 SPIKE — composition typecheck demo. Reverted at end of Phase 0.
 *
 * Proves that <SegmentationProvider> + useSegment(name) compose over the
 * existing matchesAudience predicate (lifted from @tour-kit/announcements
 * for Phase 0 measurement) without re-implementing audience evaluation.
 *
 * This file does NOT execute. It exists only so `pnpm --filter @tour-kit/core
 * typecheck` enforces the type contract — tsc runs against all .tsx in src/.
 */

import type { AudienceCondition } from '../../types/audience'
import { matchesAudience } from '../audience'
import { SegmentationProvider } from './segmentation-context'
import { useSegment } from './use-segment'

// --- Static typing --------------------------------------------------------

const adminConditions: AudienceCondition[] = [
  { type: 'user_property', key: 'role', operator: 'equals', value: 'admin' },
]

// SegmentDefinition path: matchesAudience returns true with a matching context.
const adminMatch: boolean = matchesAudience(adminConditions, { role: 'admin' })

// --- Runtime composition demo --------------------------------------------

function AdminGate() {
  // useSegment threads through: provider → segments map → matchesAudience.
  const isAdmin = useSegment('admins')
  const isBeta = useSegment('betas')
  return (
    <div>
      admin? {String(isAdmin)} | beta? {String(isBeta)}
    </div>
  )
}

export function CompositionDemo() {
  return (
    <SegmentationProvider
      segments={{
        admins: [{ type: 'user_property', key: 'role', operator: 'equals', value: 'admin' }],
        betas: { type: 'static', userIds: ['u1', 'u2'] },
      }}
      userContext={{ role: 'admin' }}
      currentUserId="u1"
    >
      <AdminGate />
    </SegmentationProvider>
  )
}

// Surface the runtime check as a module-level constant so it isn't tree-shaken
// out of the typecheck (and so reviewers can `console.log` it from a REPL).
export const __SPIKE_RUNTIME_CHECK = adminMatch
